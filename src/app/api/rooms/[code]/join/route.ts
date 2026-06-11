import type { NextRequest } from "next/server";
import { createCode } from "@/lib/locker";
import { getCloudflareBindings, json, requireSiteAuth } from "@/lib/locker";
import { hashRoomCode, hashAccessToken, hashRefreshToken, JOIN_TOKEN_MAX_AGE_MS, REFRESH_TOKEN_MAX_AGE_MS } from "@/server/room-utils";

// POST /api/rooms/[code]/join — validate room + get access & refresh tokens
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

	// Create access token (5 min) and refresh token (12 h)
	const now = Date.now();
	const accessToken = createCode(16);
	const refreshToken = createCode(16);
	const accessTokenHash = await hashAccessToken(accessToken);
	const refreshTokenHash = await hashRefreshToken(refreshToken);

	await db
		.prepare(
			`INSERT INTO rooms_join_tokens (token_hash, room_code_hash, expires_at, created_at, refresh_token_hash, refresh_expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(accessTokenHash, codeHash, now + JOIN_TOKEN_MAX_AGE_MS, now, refreshTokenHash, now + REFRESH_TOKEN_MAX_AGE_MS)
		.run();

	return json({
		joinToken: accessToken,
		refreshToken,
		roomCode: normalizedCode,
		expiresAt: new Date(now + JOIN_TOKEN_MAX_AGE_MS).toISOString(),
		refreshExpiresAt: new Date(now + REFRESH_TOKEN_MAX_AGE_MS).toISOString(),
	});
}
