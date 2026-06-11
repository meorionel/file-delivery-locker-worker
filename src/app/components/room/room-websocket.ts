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
	let currentToken = joinToken;
	let ws: WebSocket | null = null;
	let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	let pingInterval: ReturnType<typeof setInterval> | null = null;
	let destroyed = false;
	let retryCount = 0;

	function getWebSocketUrl() {
		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		return `${protocol}//${window.location.host}/api/rooms/ws?code=${encodeURIComponent(roomCode)}&token=${encodeURIComponent(currentToken)}`;
	}

	function connect() {
		if (destroyed) return;

		const url = getWebSocketUrl();

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

	/** Update the join token and reconnect with the new token */
	function updateToken(newToken: string): void {
		currentToken = newToken;
		if (destroyed) return;

		// Disconnect existing connection and reconnect with the new token
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
				ws.close(1000, "Token refresh");
			}
			ws = null;
		}
		retryCount = 0;
		connect();
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

	return { requestSync, updateToken, destroy };
}
