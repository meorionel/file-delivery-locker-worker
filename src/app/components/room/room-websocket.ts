import type { WsClientMessage, WsServerMessage } from "./room-types";

const MAX_RETRIES = 3;

type WebSocketHandlers = {
	onSync: (files: WsServerMessage & { type: "sync" }) => void;
	onUserCount: (count: number) => void;
	onError: (message: string) => void;
	onStatusChange: (status: string) => void;
	onWsUnavailable: () => void;
};

export function createRoomWebSocket(roomCode: string, joinToken: string, handlers: WebSocketHandlers) {
	let ws: WebSocket | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let pingInterval: ReturnType<typeof setInterval> | null = null;
	let destroyed = false;
	let retryCount = 0;

	function connect() {
		if (destroyed) return;

		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const url = `${protocol}//${window.location.host}/api/rooms/ws?code=${encodeURIComponent(roomCode)}&token=${encodeURIComponent(joinToken)}`;

		handlers.onStatusChange("connecting");

		try {
			ws = new WebSocket(url);
		} catch {
			handleConnectionFailure();
			return;
		}

		ws.onopen = () => {
			retryCount = 0;
			handlers.onStatusChange("connected");
			send({ type: "subscribe" });
			startPing();
		};

		ws.onmessage = (event) => {
			try {
				const msg: WsServerMessage = JSON.parse(event.data as string);
				switch (msg.type) {
					case "sync":
						handlers.onSync(msg);
						break;
					case "userJoined":
					case "userLeft":
						handlers.onUserCount(msg.count);
						break;
					case "pong":
						break;
					case "error":
						handlers.onError(msg.message);
						break;
				}
			} catch {
				// Ignore malformed messages
			}
		};

		ws.onclose = () => {
			stopPing();
			handleConnectionFailure();
		};

		ws.onerror = () => {
			stopPing();
			handleConnectionFailure();
		};
	}

	function handleConnectionFailure() {
		if (destroyed) return;
		retryCount += 1;
		if (retryCount >= MAX_RETRIES) {
			handlers.onStatusChange("rest-fallback");
			handlers.onWsUnavailable();
			return;
		}
		handlers.onStatusChange("disconnected");
		scheduleReconnect();
	}

	function send(msg: WsClientMessage) {
		if (ws?.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(msg));
		}
	}

	function startPing() {
		stopPing();
		pingInterval = setInterval(() => {
			send({ type: "ping" });
		}, 30000);
	}

	function stopPing() {
		if (pingInterval) {
			clearInterval(pingInterval);
			pingInterval = null;
		}
	}

	function scheduleReconnect() {
		if (destroyed) return;
		if (reconnectTimer) return;
		reconnectTimer = setTimeout(() => {
			reconnectTimer = null;
			connect();
		}, 3000);
	}

	function requestSync() {
		send({ type: "syncRequest" });
	}

	function destroy() {
		destroyed = true;
		stopPing();
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
		if (ws) {
			ws.onclose = null;
			ws.onerror = null;
			ws.onmessage = null;
			if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
				ws.close(1000, "Leave room");
			}
			ws = null;
		}
	}

	connect();

	return { requestSync, destroy };
}
