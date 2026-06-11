import type { NextRequest } from "next/server";
import { createCode } from "@/lib/locker";
import { getCloudflareBindings, json, requireSiteAuth } from "@/lib/locker";
import { hashRoomCode, hashJoinToken, JOIN_TOKEN_MAX_AGE_MS } from "@/server/room-utils";

// POST /api/rooms/[code]/join — validate room + get join token
export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
	const authError = await requireSiteAuth(request);
	if (authError) return authError;

	const { code } = await params;
	const { db } = await getCloudflareBindings();
	if (!db) return json({ error: "Database not available" }, 500);

	const normalizedCode = code
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 6);
	const codeHash = await hashRoomCode(normalizedCode);

	// Validate room exists
	const room = await db.prepare("SELECT code_hash FROM rooms WHERE code_hash = ?").bind(codeHash).first<{ code_hash: string }>();

	if (!room) {
		return json({ error: "Room not found" }, 404);
	}

	// Create join token
	const now = Date.now();
	const token = createCode(16);
	const tokenHash = await hashJoinToken(token);

	await db
		.prepare(
			`INSERT INTO rooms_join_tokens (token_hash, room_code_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?)`
		)
		.bind(tokenHash, codeHash, now + JOIN_TOKEN_MAX_AGE_MS, now)
		.run();

	return json({
		joinToken: token,
		roomCode: normalizedCode,
		expiresAt: new Date(now + JOIN_TOKEN_MAX_AGE_MS).toISOString(),
	});
}
