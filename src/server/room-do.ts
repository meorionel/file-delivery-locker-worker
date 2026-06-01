import type { RoomFilePublic, WsClientMessage, WsServerMessage } from "./room-types";

const ROOM_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ALARM_INTERVAL_MS = 60 * 1000; // check every 60s

// Minimal types for Cloudflare Worker bindings in the DO context
interface RoomD1Statement {
  bind(...values: unknown[]): RoomD1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
  run(): Promise<unknown>;
}

interface RoomDb {
  prepare(query: string): RoomD1Statement;
}

interface RoomBucket {
  get(key: string): Promise<{ body: ReadableStream<Uint8Array>; httpEtag: string; text(): Promise<string> } | null>;
  put(key: string, value: ReadableStream | ArrayBuffer, options?: Record<string, unknown>): Promise<unknown>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ objects: Array<{ key: string }> }>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DurableObjectState = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CloudflareWebSocket = any;

interface RoomEnv {
  DB: RoomDb;
  FILE_BUCKET: RoomBucket;
}

type RoomStoredState = {
  codeHash: string;
  storagePrefix: string;
  createdAt: number;
  lastActivityAt: number;
};

async function hashText(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function serializeRoomFile(row: Record<string, unknown>): RoomFilePublic {
  return {
    id: String(row.id ?? ""),
    fileName: String(row.file_name ?? ""),
    contentType: String(row.content_type ?? ""),
    kind: (row.delivery_kind === "text" ? "text" : "file") as "file" | "text",
    size: Number(row.size ?? 0),
    createdAt: new Date(Number(row.created_at ?? 0)).toISOString(),
  };
}

export class Room {
  private state: DurableObjectState;
  private env: RoomEnv;
  private roomState: RoomStoredState | null = null;

  constructor(state: DurableObjectState, env: RoomEnv) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get("upgrade");
    if (upgrade !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 400 });
    }

    const url = new URL(request.url);
    const joinToken = url.searchParams.get("token");
    if (!joinToken) {
      return new Response("Missing join token", { status: 401 });
    }

    const valid = await this.validateJoinToken(joinToken);
    if (!valid) {
      return new Response("Invalid or expired join token", { status: 401 });
    }

    await this.ensureRoomState(url.searchParams.get("code") || "");

    // Accept WebSocket (Cloudflare Workers runtime API)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pair = new (globalThis as any).WebSocketPair() as { 0: CloudflareWebSocket; 1: CloudflareWebSocket };
    const client = pair[0];
    const server = pair[1];

    this.state.acceptWebSocket(server);

    const count = this.state.getWebSockets().length;
    this.broadcast({ type: "userJoined", count });

    await this.state.storage.setAlarm(Date.now() + ALARM_INTERVAL_MS);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Response(null, { status: 101, webSocket: client } as any);
  }

  async webSocketMessage(ws: CloudflareWebSocket, message: string): Promise<void> {
    try {
      const msg: WsClientMessage = JSON.parse(message);
      switch (msg.type) {
        case "ping":
          ws.send(JSON.stringify({ type: "pong" } satisfies WsServerMessage));
          break;
        case "syncRequest":
          await this.sendFileList();
          break;
        case "subscribe":
          await this.sendFileList();
          break;
      }
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
    }
  }

  async webSocketClose(ws: CloudflareWebSocket): Promise<void> {
    ws.close(1000, "Left room");
    const count = this.state.getWebSockets().length;
    this.broadcast({ type: "userLeft", count }, ws);
  }

  async webSocketError(ws: CloudflareWebSocket): Promise<void> {
    try {
      ws.close(1011, "Internal error");
    } catch {
      // ignore close errors
    }
  }

  async alarm(): Promise<void> {
    const now = Date.now();
    const wsCount = this.state.getWebSockets().length;

    const stored: RoomStoredState = await this.state.storage.get("roomState");
    if (!stored) return;

    if (wsCount === 0) {
      if (now - stored.lastActivityAt > ROOM_IDLE_TIMEOUT_MS) {
        await this.destroyRoom(stored);
        return;
      }
    } else {
      stored.lastActivityAt = now;
      await this.state.storage.put("roomState", stored);
    }

    await this.state.storage.setAlarm(now + ALARM_INTERVAL_MS);
  }

  private async ensureRoomState(code: string): Promise<void> {
    if (this.roomState) return;

    const stored: RoomStoredState = await this.state.storage.get("roomState");
    if (stored) {
      this.roomState = stored;
      return;
    }

    const normalizedCode = code.toUpperCase();
    const codeHash = await hashText(`room-code:${normalizedCode}`);
    const row = await this.env.DB.prepare(
      "SELECT code_hash, code, storage_prefix, created_at, last_activity_at FROM rooms WHERE code_hash = ?"
    )
      .bind(codeHash)
      .first<Record<string, unknown>>();

    if (!row) {
      throw new Error("Room not found");
    }

    this.roomState = {
      codeHash: String(row.code_hash),
      storagePrefix: String(row.storage_prefix),
      createdAt: Number(row.created_at),
      lastActivityAt: Number(row.last_activity_at),
    };

    await this.state.storage.put("roomState", this.roomState);
  }

  private async validateJoinToken(token: string): Promise<boolean> {
    const now = Date.now();
    const tokenHash = await hashText(`room-join:${token}`);

    const row = await this.env.DB.prepare(
      "SELECT room_code_hash FROM rooms_join_tokens WHERE token_hash = ? AND expires_at > ?"
    )
      .bind(tokenHash, now)
      .first<Record<string, unknown>>();

    return row !== null;
  }

  private async sendFileList(): Promise<void> {
    if (!this.roomState) return;

    const rows = await this.env.DB.prepare(
      `SELECT id, file_name, content_type, delivery_kind, size, created_at
       FROM room_files
       WHERE room_code_hash = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`
    )
      .bind(this.roomState.codeHash)
      .all<Record<string, unknown>>();

    const files: RoomFilePublic[] = (rows.results ?? []).map(serializeRoomFile);

    this.broadcast({ type: "sync", files });
  }

  private broadcast(message: WsServerMessage, exclude?: CloudflareWebSocket): void {
    const payload = JSON.stringify(message);
    for (const ws of this.state.getWebSockets() as CloudflareWebSocket[]) {
      if (ws === exclude) continue;
      try {
        ws.send(payload);
      } catch {
        // ignore send errors
      }
    }
  }

  private async destroyRoom(state: RoomStoredState): Promise<void> {
    const db = this.env.DB;
    const bucket = this.env.FILE_BUCKET;

    try {
      const listResult = await bucket.list({ prefix: state.storagePrefix });
      for (const obj of listResult.objects) {
        await bucket.delete(obj.key);
      }
    } catch {
      // Ignore R2 cleanup errors
    }

    await db.prepare("DELETE FROM room_files WHERE room_code_hash = ?")
      .bind(state.codeHash)
      .run();

    await db.prepare("DELETE FROM rooms_join_tokens WHERE room_code_hash = ?")
      .bind(state.codeHash)
      .run();

    await db.prepare("DELETE FROM rooms WHERE code_hash = ?")
      .bind(state.codeHash)
      .run();

    await this.state.storage.deleteAll();
  }
}
