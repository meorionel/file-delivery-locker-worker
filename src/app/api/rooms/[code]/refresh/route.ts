import type { NextRequest } from "next/server";
import { createCode } from "@/lib/locker";
import { getCloudflareBindings, json, requireSiteAuth } from "@/lib/locker";
import { hashRoomCode, hashAccessToken, hashRefreshToken, JOIN_TOKEN_MAX_AGE_MS } from "@/server/room-utils";

// POST /api/rooms/[code]/refresh — exchange a valid refresh token for a new access token
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

	let body: { refreshToken?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: "Invalid request body" }, 400);
	}

	const { refreshToken } = body;
	if (!refreshToken) {
		return json({ error: "Refresh token is required" }, 400);
	}

	const refreshTokenHash = await hashRefreshToken(refreshToken);
	const now = Date.now();

	// Validate refresh token (not expired, room still exists via FK constraint)
	const row = await db
		.prepare(
			"SELECT room_code_hash, token_hash FROM rooms_join_tokens WHERE refresh_token_hash = ? AND refresh_expires_at > ?"
		)
		.bind(refreshTokenHash, now)
		.first<{ room_code_hash: string; token_hash: string }>();

	if (!row) {
		return json({ error: "Invalid or expired refresh token" }, 401);
	}

	// Verify the token belongs to the requested room
	if (row.room_code_hash !== codeHash) {
		return json({ error: "Refresh token does not match this room" }, 403);
	}

	// Generate new access token
	const newAccessToken = createCode(16);
	const newAccessTokenHash = await hashAccessToken(newAccessToken);
	const newExpiresAt = now + JOIN_TOKEN_MAX_AGE_MS;

	// Update the row with the new access token hash and expiry
	await db
		.prepare("UPDATE rooms_join_tokens SET token_hash = ?, expires_at = ? WHERE refresh_token_hash = ?")
		.bind(newAccessTokenHash, newExpiresAt, refreshTokenHash)
		.run();

	return json({
		joinToken: newAccessToken,
		expiresAt: new Date(newExpiresAt).toISOString(),
	});
}
