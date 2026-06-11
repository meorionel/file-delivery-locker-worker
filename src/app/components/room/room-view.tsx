"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { GooeyToaster, gooeyToast } from "goey-toast";
import { useI18n } from "@/app/i18n";
import { readApiJson } from "@/app/components/api-json";
import { getDownloadFileName } from "@/lib/file";
import { clearRoomState } from "@/app/components/mode-nav-switch";
import { RoomUploadBar } from "./room-upload-bar";
import { RoomFileList } from "./room-file-list";
import { RoomFileModal } from "./room-file-modal";
import { createRoomWebSocket } from "./room-websocket";
import type { RoomFile, RefreshResult, WsServerMessage } from "./room-types";

const REFRESH_MARGIN_MS = 60_000; // Refresh 1 minute before expiry
const REFRESH_CHECK_INTERVAL_MS = 30_000; // Check every 30 seconds

type Props = {
	roomCode: string;
	joinToken: string;
};

function getStoredTokens(roomCode: string): { refreshToken: string | null; expiresAt: number | null } {
	try {
		const refreshToken = sessionStorage.getItem(`room-refresh-token:${roomCode}`);
		const expiresAtStr = sessionStorage.getItem(`room-expires-at:${roomCode}`);
		return {
			refreshToken,
			expiresAt: expiresAtStr ? new Date(expiresAtStr).getTime() : null,
		};
	} catch {
		return { refreshToken: null, expiresAt: null };
	}
}

function storeTokens(roomCode: string, refreshToken: string, expiresAt: string): void {
	try {
		sessionStorage.setItem(`room-refresh-token:${roomCode}`, refreshToken);
		sessionStorage.setItem(`room-expires-at:${roomCode}`, expiresAt);
	} catch {
		// sessionStorage may be unavailable
	}
}

function clearStoredTokens(roomCode: string): void {
	try {
		sessionStorage.removeItem(`room-refresh-token:${roomCode}`);
		sessionStorage.removeItem(`room-expires-at:${roomCode}`);
	} catch {
		// sessionStorage may be unavailable
	}
}

export function RoomView({ roomCode, joinToken: initialJoinToken }: Props) {
	const { t } = useI18n();
	const router = useRouter();
	const [joinToken, setJoinToken] = useState(initialJoinToken);
	const joinTokenRef = useRef(joinToken);
	const [files, setFiles] = useState<RoomFile[]>([]);
	const [userCount, setUserCount] = useState(1);
	const [status, setStatus] = useState("connecting");
	const [previewFile, setPreviewFile] = useState<RoomFile | null>(null);
	const [previewText, setPreviewText] = useState("");
	const wsRef = useRef<ReturnType<typeof createRoomWebSocket> | null>(null);
	const wsAvailable = useRef(false);
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const refreshTokenRef = useRef<string | null>(null);
	const expiresAtRef = useRef<number>(0);

	// Keep joinTokenRef in sync with joinToken state
	useEffect(() => {
		joinTokenRef.current = joinToken;
	}, [joinToken]);

	// Initialize tokens from sessionStorage on mount
	useEffect(() => {
		const { refreshToken, expiresAt } = getStoredTokens(roomCode);
		refreshTokenRef.current = refreshToken;
		expiresAtRef.current = expiresAt ?? 0;
	}, [roomCode]);

	// Attempt to refresh the access token
	const refreshAccessToken = useCallback(async () => {
		const storedRefreshToken = refreshTokenRef.current;
		if (!storedRefreshToken) return false;

		try {
			const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/refresh`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ refreshToken: storedRefreshToken }),
			});
			const data = await readApiJson<RefreshResult>(response, "refresh");
			if (!response.ok || !data.joinToken) {
				throw new Error((data as { error?: string }).error ?? "Refresh failed");
			}

			// Update token state
			setJoinToken(data.joinToken);
			expiresAtRef.current = new Date(data.expiresAt).getTime();

			// Update sessionStorage expiry
			storeTokens(roomCode, storedRefreshToken, data.expiresAt);

			// Reconnect WebSocket with the new token
			wsRef.current?.updateToken(data.joinToken);

			return true;
		} catch {
			// Refresh token is invalid/expired — clear stored tokens
			clearStoredTokens(roomCode);
			refreshTokenRef.current = null;
			expiresAtRef.current = 0;
			return false;
		}
	}, [roomCode]);

	// Check if token needs refresh and do it
	const checkAndRefresh = useCallback(async () => {
		const now = Date.now();
		const expiresAt = expiresAtRef.current;

		// No refresh token available — nothing to do
		if (!refreshTokenRef.current) return;

		// Token is still valid for more than the margin
		if (expiresAt > 0 && now < expiresAt - REFRESH_MARGIN_MS) return;

		// Token is expired or about to expire — refresh
		const success = await refreshAccessToken();
		if (!success) {
			// Refresh failed — redirect to room gate
			clearRoomState();
			router.push("/room");
		}
	}, [refreshAccessToken, router]);

	// On mount: check if the initial token is already expired
	useEffect(() => {
		const { refreshToken, expiresAt } = getStoredTokens(roomCode);
		refreshTokenRef.current = refreshToken;
		expiresAtRef.current = expiresAt ?? 0;

		// If the access token from URL is expired and we have a refresh token, refresh immediately
		const now = Date.now();
		if (refreshToken && expiresAt && now >= expiresAt) {
			refreshAccessToken().then((success) => {
				if (!success) {
					clearStoredTokens(roomCode);
					clearRoomState();
					router.push("/room");
				}
			});
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// Periodic check for token refresh
	useEffect(() => {
		const interval = setInterval(() => {
			checkAndRefresh();
		}, REFRESH_CHECK_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [checkAndRefresh]);

	function handleExitRoom() {
		clearRoomState();
		clearStoredTokens(roomCode);
		router.push("/room");
	}

	async function handleCopyCode() {
		try {
			await navigator.clipboard.writeText(roomCode);
			gooeyToast.success(t("common.copy"), {
				preset: "subtle",
				showTimestamp: false,
				showProgress: true,
			});
		} catch {
			// Clipboard API may be unavailable
		}
	}

	/** Fetch file list via REST API (fallback when WebSocket is unavailable) */
	const fetchFilesRest = useCallback(async () => {
		try {
			const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/files`, { headers: { "x-join-token": joinTokenRef.current } });
			const data = await readApiJson<{ error?: string; files?: RoomFile[] }>(response, "fetchFiles");
			if (response.ok && data.files) {
				setFiles(data.files);
			}
		} catch {
			// Silently fail — will retry on next upload
		}
	}, [roomCode]);

	const handleSync = useCallback((msg: WsServerMessage & { type: "sync" }) => {
		setFiles(msg.files);
	}, []);

	const handleUserCount = useCallback((count: number) => {
		setUserCount(count);
	}, []);

	const handleError = useCallback((_message: string) => {
		// Errors are shown via status badge
	}, []);

	const handleStatusChange = useCallback((newStatus: string) => {
		setStatus(newStatus);
	}, []);

	const handleWsUnavailable = useCallback(() => {
		wsAvailable.current = false;
		fetchFilesRest();
		pollingRef.current = setInterval(fetchFilesRest, 5000);
	}, [fetchFilesRest]);

	useEffect(() => {
		wsAvailable.current = true;
		wsRef.current = createRoomWebSocket(roomCode, joinTokenRef.current, {
			onSync: handleSync,
			onUserCount: handleUserCount,
			onError: handleError,
			onStatusChange: handleStatusChange,
			onWsUnavailable: handleWsUnavailable,
		});

		return () => {
			wsRef.current?.destroy();
			wsRef.current = null;
			if (pollingRef.current) {
				clearInterval(pollingRef.current);
				pollingRef.current = null;
			}
		};
	}, [roomCode, handleSync, handleUserCount, handleError, handleStatusChange, handleWsUnavailable]);

	/** Called after upload. If WebSocket is down, refresh via REST. */
	function requestSync() {
		if (wsAvailable.current) {
			wsRef.current?.requestSync();
		} else {
			fetchFilesRest();
		}
	}

	async function handleDownload(file: RoomFile) {
		try {
			const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/files/${encodeURIComponent(file.id)}/download`, { headers: { "x-join-token": joinTokenRef.current } });
			if (!response.ok) {
				await readApiJson<{ error?: string }>(response, t("message.downloadFailed"));
				throw new Error(t("message.downloadFailed"));
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = getDownloadFileName(response.headers.get("content-disposition"), file.fileName);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.setTimeout(() => URL.revokeObjectURL(url), 1000);
		} catch (err) {
			gooeyToast.error(err instanceof Error ? err.message : t("message.downloadFailed"), {
				preset: "subtle",
				showTimestamp: false,
				showProgress: true,
			});
		}
	}

	async function handlePreview(file: RoomFile) {
		setPreviewFile(file);
		try {
			const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/files/${encodeURIComponent(file.id)}/preview`, { headers: { "x-join-token": joinTokenRef.current } });
			const data = await readApiJson<{ error?: string; text?: string }>(response, t("message.previewFailed"));
			if (!response.ok || data.text === undefined) {
				throw new Error(data.error ?? t("message.previewFailed"));
			}
			setPreviewText(data.text);
		} catch (err) {
			gooeyToast.error(err instanceof Error ? err.message : t("message.previewFailed"), {
				preset: "subtle",
				showTimestamp: false,
				showProgress: true,
			});
			setPreviewFile(null);
			setPreviewText("");
		}
	}

	const statusText =
		status === "connected"
			? t("room.clients", { count: userCount })
			: status === "rest-fallback"
				? "REST"
				: status === "disconnected" || status === "error"
					? "DISCONNECT"
					: t("room.connecting");

	return (
		<div className="flex h-screen flex-col">
			<div className="mx-auto w-full max-w-[1200px] px-5 pt-6 min-[960px]:px-10 sm:px-8">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex items-center gap-3">
						<h2 className="m-0 text-[28px] leading-[1.2] font-[var(--font-display)] font-normal tracking-[-0.011em]">
							<strong>{roomCode}</strong>
						</h2>
						<span className={`room-status room-status-${status}`}>
							<span className={`room-status-dot room-status-dot-${status}`} />
							{statusText}
						</span>
					</div>
					<div className="flex items-center gap-1.5">
						<button
							className="inline-flex h-7 cursor-pointer items-center justify-center rounded-md border border-[var(--hairline)] bg-transparent px-2.5 text-xs leading-none font-medium whitespace-nowrap text-[var(--muted)] transition-all duration-[120ms] hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
							onClick={handleCopyCode}
							title={t("room.copyCode")}
						>
							<Icon icon="tabler:copy" className="mr-1" />
							{t("room.copyCode")}
						</button>
						<button
							className="inline-flex h-7 cursor-pointer items-center justify-center rounded-md border border-[var(--hairline)] bg-transparent px-2.5 text-xs leading-none font-medium whitespace-nowrap text-[var(--error)] transition-all duration-[120ms] hover:bg-[var(--error)]/10"
							onClick={handleExitRoom}
							title={t("room.exitRoom")}
						>
							<Icon icon="tabler:door-exit" className="mr-1" />
							{t("room.exitRoom")}
						</button>
					</div>
				</div>
			</div>

			<div ref={listRef} className="mx-auto w-full max-w-[1200px] flex-1 overflow-y-auto px-5 pb-4 min-[960px]:px-10 sm:px-8">
				<RoomFileList files={files} onDownload={handleDownload} onPreview={handlePreview} />
			</div>

			<RoomUploadBar roomCode={roomCode} joinToken={joinToken} onUploaded={requestSync} />

			{previewFile && previewText && (
				<RoomFileModal
					file={previewFile}
					text={previewText}
					onClose={() => {
						setPreviewFile(null);
						setPreviewText("");
					}}
				/>
			)}

			<GooeyToaster closeButton="top-right" position="bottom-right" preset="subtle" showProgress visibleToasts={3} />
		</div>
	);
}
