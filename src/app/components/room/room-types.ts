export type DeliveryKind = "file" | "text";

export interface RoomFile {
	id: string;
	fileName: string;
	contentType: string;
	kind: DeliveryKind;
	size: number;
	createdAt: string;
}

export interface RoomInfo {
	code: string;
	fileCount: number;
	createdAt: string;
}

export interface JoinResult {
	joinToken: string;
	roomCode: string;
	expiresAt: string;
}

export interface UploadFileResult {
	id: string;
	fileName: string;
	kind: DeliveryKind;
	size: number;
	createdAt: string;
}

// WebSocket server message types
export interface WsSyncMessage {
	type: "sync";
	files: RoomFile[];
}

export interface WsUserMessage {
	type: "userJoined" | "userLeft";
	count: number;
}

export interface WsPongMessage {
	type: "pong";
}

export interface WsErrorMessage {
	type: "error";
	message: string;
}

export type WsServerMessage = WsSyncMessage | WsUserMessage | WsPongMessage | WsErrorMessage;

// WebSocket client message types
export type WsClientMessage = { type: "ping" } | { type: "syncRequest" } | { type: "subscribe" };
