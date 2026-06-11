import type { NextRequest } from "next/server";
import { contentDisposition, getCloudflareBindings, json, requireSiteAuth } from "@/lib/locker";
import { hashRoomCode, hashJoinToken } from "@/server/room-utils";
import type { RoomFileRow } from "@/server/room-types";

async function validateJoinToken(db: NonNullable<Awaited<ReturnType<typeof getCloudflareBindings>>["db"]>, token: string | null): Promise<string | null> {
	if (!token) return null;
	const tokenHash = await hashJoinToken(token);
	const row = await db
		.prepare("SELECT room_code_hash FROM rooms_join_tokens WHERE token_hash = ? AND expires_at > ?")
		.bind(tokenHash, Date.now())
		.first<{ room_code_hash: string }>();
	return row?.room_code_hash ?? null;
}

// GET /api/rooms/[code]/files/[fileId]/download
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string; fileId: string }> }) {
	const authError = await requireSiteAuth(request);
	if (authError) return authError;

	const { code, fileId } = await params;
	const { db, bucket } = await getCloudflareBindings();
	if (!db || !bucket) return json({ error: "Bindings not available" }, 500);

	const joinToken = request.headers.get("x-join-token");
	const roomCodeHash = await validateJoinToken(db, joinToken);
	if (!roomCodeHash) {
		return json({ error: "Invalid or expired join token" }, 401);
	}

	const normalizedCode = code
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 6);
	const codeHash = await hashRoomCode(normalizedCode);
	if (roomCodeHash !== codeHash) {
		return json({ error: "Join token does not match room" }, 403);
	}

	const row = await db
		.prepare(
			`SELECT id, storage_key, file_name, content_type, delivery_kind, size,
              max_downloads, download_count, expires_at, deleted_at
       FROM room_files
       WHERE id = ? AND room_code_hash = ? AND deleted_at IS NULL`
		)
		.bind(fileId, codeHash)
		.first<RoomFileRow>();

	if (!row) {
		return json({ error: "File not found" }, 404);
	}

	const now = Date.now();
	if (row.expires_at !== 0 && row.expires_at <= now) {
		return json({ error: "File has expired" }, 410);
	}

	const r2Object = await bucket.get(row.storage_key);
	if (!r2Object) {
		return json({ error: "File data not found" }, 404);
	}

	// Increment download count
	await db.prepare("UPDATE room_files SET download_count = download_count + 1 WHERE id = ?").bind(row.id).run();

	const headers = new Headers();
	headers.set("content-type", row.content_type);
	headers.set("content-disposition", contentDisposition(row.file_name));
	headers.set("cache-control", "no-store");
	headers.set("etag", r2Object.httpEtag);

	return new Response(r2Object.body, { headers });
}
