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
import type { RoomFile, WsServerMessage } from "./room-types";

type Props = {
	roomCode: string;
	joinToken: string;
};

export function RoomView({ roomCode, joinToken }: Props) {
	const { t } = useI18n();
	const router = useRouter();
	const [files, setFiles] = useState<RoomFile[]>([]);
	const [userCount, setUserCount] = useState(1);
	const [status, setStatus] = useState("connecting");
	const [previewFile, setPreviewFile] = useState<RoomFile | null>(null);
	const [previewText, setPreviewText] = useState("");
	const wsRef = useRef<ReturnType<typeof createRoomWebSocket> | null>(null);
	const wsAvailable = useRef(false);
	const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const listRef = useRef<HTMLDivElement>(null);

	function handleExitRoom() {
		clearRoomState();
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
			const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/files`, { headers: { "x-join-token": joinToken } });
			const data = await readApiJson<{ error?: string; files?: RoomFile[] }>(response, "fetchFiles");
			if (response.ok && data.files) {
				setFiles(data.files);
			}
		} catch {
			// Silently fail — will retry on next upload
		}
	}, [roomCode, joinToken]);

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
		wsRef.current = createRoomWebSocket(roomCode, joinToken, {
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
	}, [roomCode, joinToken, handleSync, handleUserCount, handleError, handleStatusChange, handleWsUnavailable]);

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
			const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/files/${encodeURIComponent(file.id)}/download`, { headers: { "x-join-token": joinToken } });
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
			const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/files/${encodeURIComponent(file.id)}/preview`, { headers: { "x-join-token": joinToken } });
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
