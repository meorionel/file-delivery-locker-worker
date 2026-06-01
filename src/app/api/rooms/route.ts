import type { NextRequest } from "next/server";
import { createPickupCode, getCloudflareBindings, json, requireSiteAuth, requireWritableMode } from "@/lib/locker";
import { hashRoomCode } from "@/server/room-utils";

// POST /api/rooms — create a room
export async function POST(request: NextRequest) {
  const authError = await requireSiteAuth(request);
  if (authError) return authError;

  const writableError = await requireWritableMode();
  if (writableError) return writableError;

  const { db } = await getCloudflareBindings();
  if (!db) return json({ error: "Database not available" }, 500);

  const code = createPickupCode();
  const codeHash = await hashRoomCode(code);
  const storagePrefix = `rooms/${code}/`;
  const now = Date.now();

  await db
    .prepare(
      `INSERT INTO rooms (code_hash, code, storage_prefix, created_at, last_activity_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(codeHash, code, storagePrefix, now, now)
    .run();

  return json({ code, createdAt: new Date(now).toISOString() });
}
