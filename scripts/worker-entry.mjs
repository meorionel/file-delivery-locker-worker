// Custom worker entry for File Delivery Locker
// Wraps the OpenNext-generated worker with Durable Object support for Room mode.
//
// After OpenNext build, the generated worker is at ../.open-next/worker.js
// and compiled server functions are under ../.open-next/server-functions/

import { Room as OriginalRoom } from "../.open-next/server-functions/default/src/server/room-do.mjs";

let openNextHandler;
async function getOpenNextHandler() {
	if (!openNextHandler) {
		const mod = await import("../.open-next/worker.js");
		openNextHandler = mod.default || mod;
	}
	return openNextHandler;
}

export { OriginalRoom as Room };

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		// Route WebSocket upgrade requests to Room Durable Object
		if (url.pathname === "/api/rooms/ws" && request.headers.get("upgrade") === "websocket") {
			const code = url.searchParams.get("code");
			if (code && env.ROOM_DO) {
				const roomId = env.ROOM_DO.idFromName(code.toUpperCase());
				const stub = env.ROOM_DO.get(roomId);
				return stub.fetch(request);
			}
			return new Response("Missing room code", { status: 400 });
		}

		const handler = await getOpenNextHandler();
		return handler.fetch(request, env, ctx);
	},
};
