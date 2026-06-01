import type { NextRequest } from "next/server";
import { getCloudflareBindings, json, requireSiteAuth } from "@/lib/locker";
import { hashRoomCode } from "@/server/room-utils";

// GET /api/rooms/[code] — validate room exists
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const authError = await requireSiteAuth(request);
  if (authError) return authError;

  const { code } = await params;
  const { db } = await getCloudflareBindings();
  if (!db) return json({ error: "Database not available" }, 500);

  const normalizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  const codeHash = await hashRoomCode(normalizedCode);

  const room = await db
    .prepare("SELECT code, created_at FROM rooms WHERE code_hash = ?")
    .bind(codeHash)
    .first<{ code: string; created_at: number }>();

  if (!room) {
    return json({ error: "Room not found" }, 404);
  }

  const fileCount = await db
    .prepare("SELECT COUNT(*) as count FROM room_files WHERE room_code_hash = ? AND deleted_at IS NULL")
    .bind(codeHash)
    .first<{ count: number }>();

  return json({
    code: room.code,
    fileCount: fileCount?.count ?? 0,
    createdAt: new Date(room.created_at).toISOString(),
  });
}
