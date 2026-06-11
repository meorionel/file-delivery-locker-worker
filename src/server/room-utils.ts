export async function hashRoomCode(code: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`room-code:${code}`));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashJoinToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`room-join:${token}`));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Alias: hash an access token (same prefix as join token) */
export const hashAccessToken = hashJoinToken;

export async function hashRefreshToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`room-refresh:${token}`));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const JOIN_TOKEN_MAX_AGE_MS = 5 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE_MS = 12 * 60 * 60 * 1000;
