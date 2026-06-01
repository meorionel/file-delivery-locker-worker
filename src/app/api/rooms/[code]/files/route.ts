import type { NextRequest } from "next/server";
import {
  createCode,
  getCloudflareBindings,
  getContentType,
  getRequestSource,
  getSafeFileName,
  hashContentBytes,
  json,
  MAX_FILE_SIZE,
  MAX_TEXT_SIZE,
  parseDeliveryKind,
  requireSiteAuth,
  requireWritableMode,
} from "@/lib/locker";
import { hashRoomCode, hashJoinToken } from "@/server/room-utils";
import type { RoomFilePublic } from "@/server/room-types";

async function validateJoinToken(db: NonNullable<Awaited<ReturnType<typeof getCloudflareBindings>>["db"]>, token: string | null): Promise<string | null> {
  if (!token) return null;
  const tokenHash = await hashJoinToken(token);
  const row = await db
    .prepare("SELECT room_code_hash FROM rooms_join_tokens WHERE token_hash = ? AND expires_at > ?")
    .bind(tokenHash, Date.now())
    .first<{ room_code_hash: string }>();
  return row?.room_code_hash ?? null;
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

// GET /api/rooms/[code]/files — list all files in a room
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const authError = await requireSiteAuth(request);
  if (authError) return authError;

  const { code } = await params;
  const { db } = await getCloudflareBindings();
  if (!db) return json({ error: "Database not available" }, 500);

  const joinToken = request.headers.get("x-join-token");
  const roomCodeHash = await validateJoinToken(db, joinToken);
  if (!roomCodeHash) {
    return json({ error: "Invalid or expired join token" }, 401);
  }

  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const codeHash = await hashRoomCode(normalizedCode);
  if (roomCodeHash !== codeHash) {
    return json({ error: "Join token does not match room" }, 403);
  }

  const rows = await db
    .prepare(
      `SELECT id, file_name, content_type, delivery_kind, size, created_at
       FROM room_files
       WHERE room_code_hash = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`
    )
    .bind(codeHash)
    .all<Record<string, unknown>>();

  const files: RoomFilePublic[] = (rows.results ?? []).map(serializeRoomFile);

  return json({ files });
}

// POST /api/rooms/[code]/files — upload a file or text to a room
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const authError = await requireSiteAuth(request);
  if (authError) return authError;

  const writableError = await requireWritableMode();
  if (writableError) return writableError;

  const { code } = await params;
  const { db, bucket } = await getCloudflareBindings();
  if (!db || !bucket) return json({ error: "Bindings not available" }, 500);

  const joinToken = request.headers.get("x-join-token");
  const roomCodeHash = await validateJoinToken(db, joinToken);
  if (!roomCodeHash) {
    return json({ error: "Invalid or expired join token" }, 401);
  }

  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const codeHash = await hashRoomCode(normalizedCode);
  if (roomCodeHash !== codeHash) {
    return json({ error: "Join token does not match room" }, 403);
  }

  const deliveryKind = parseDeliveryKind(request) ?? "file";
  const isText = deliveryKind === "text";
  const now = Date.now();
  const id = crypto.randomUUID();
  const source = getRequestSource(request);

  let body: ArrayBuffer | ReadableStream;
  let fileName: string;
  let contentType: string;
  let size: number;
  let contentHash: string | null = null;

  if (isText) {
    const text = await request.text();
    if (!text.trim()) {
      return json({ error: "Text content is empty" }, 400);
    }

    const textBytes = new TextEncoder().encode(text);
    if (textBytes.length > MAX_TEXT_SIZE) {
      return json({ error: "Text exceeds 256 KB limit" }, 413);
    }

    body = textBytes.buffer as ArrayBuffer;
    fileName = getSafeFileName(request) ?? "stored-text.txt";
    contentType = "text/plain; charset=utf-8";
    size = textBytes.length;
    contentHash = await hashContentBytes(body);
  } else {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (!contentLength || contentLength > MAX_FILE_SIZE) {
      return json({ error: "File exceeds 100 MB limit" }, 413);
    }

    // Read request body into ArrayBuffer (R2 requires known-length streams)
    body = await request.arrayBuffer();
    fileName = getSafeFileName(request) ?? "download";
    contentType = getContentType(request);
    size = body.byteLength;
  }

  const expiresAt = 0; // unlimited expiry for room files
  const storagePrefix = `rooms/${normalizedCode}/`;
  const storageKey = `${storagePrefix}${id}-${fileName.replace(/[\\/\u0000-\u001f\u007f]/g, "_")}`;
  const maxDownloads = 0; // unlimited for rooms

  // Upload to R2
  await bucket.put(storageKey, body, {
    httpMetadata: { contentType },
  });

  // Insert into D1
  await db
    .prepare(
      `INSERT INTO room_files (
        id, room_code_hash, storage_key, file_name, content_type,
        delivery_kind, size, content_hash,
        upload_ip, upload_user_agent, upload_browser, upload_os, upload_device,
        max_downloads, download_count, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .bind(
      id, codeHash, storageKey, fileName, contentType,
      deliveryKind, size, contentHash,
      source.ip, source.userAgent, source.browser, source.os, source.device,
      maxDownloads, expiresAt, now
    )
    .run();

  // Update room activity
  await db
    .prepare("UPDATE rooms SET last_activity_at = ? WHERE code_hash = ?")
    .bind(now, codeHash)
    .run();

  return json({
    id,
    fileName,
    kind: deliveryKind,
    size,
    createdAt: new Date(now).toISOString(),
  }, 201);
}
