export interface RoomRow {
  code_hash: string;
  code: string;
  storage_prefix: string;
  created_at: number;
  last_activity_at: number;
}

export interface RoomFileRow {
  id: string;
  room_code_hash: string;
  storage_key: string;
  file_name: string;
  content_type: string;
  delivery_kind: "file" | "text";
  size: number;
  content_hash: string | null;
  upload_ip: string | null;
  upload_user_agent: string | null;
  upload_browser: string | null;
  upload_os: string | null;
  upload_device: string | null;
  max_downloads: number;
  download_count: number;
  expires_at: number;
  created_at: number;
  deleted_at: number | null;
}

export interface RoomFilePublic {
  id: string;
  fileName: string;
  contentType: string;
  kind: "file" | "text";
  size: number;
  createdAt: string;
}

export interface RoomJoinTokenRow {
  token_hash: string;
  room_code_hash: string;
  expires_at: number;
  created_at: number;
}

// WebSocket message types
export interface WsClientMessage {
  type: "ping" | "syncRequest" | "subscribe";
  fileId?: string;
}

export interface WsServerSyncMessage {
  type: "sync";
  files: RoomFilePublic[];
}

export interface WsServerUserMessage {
  type: "userJoined" | "userLeft";
  count: number;
}

export interface WsServerPongMessage {
  type: "pong";
}

export interface WsServerErrorMessage {
  type: "error";
  message: string;
}

export type WsServerMessage =
  | WsServerSyncMessage
  | WsServerUserMessage
  | WsServerPongMessage
  | WsServerErrorMessage;
