"use client";

import { Icon } from "@iconify/react";
import { formatBytes, formatTime } from "@/app/components/locker-format";
import { useI18n } from "@/app/i18n";
import type { RoomFile } from "./room-types";

type Props = {
	file: RoomFile;
	onDownload: (file: RoomFile) => void;
	onPreview: (file: RoomFile) => void;
};

function getFileExtension(fileName: string): string {
	const dotIndex = fileName.lastIndexOf(".");
	if (dotIndex === -1 || dotIndex === fileName.length - 1) return "";
	return fileName.slice(dotIndex + 1).toUpperCase();
}

function getFileIcon(fileName: string): string {
	const ext = fileName.split(".").pop()?.toLowerCase() || "";
	if (!ext) return "tabler:file";

	const imageExts = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp", "avif"]);
	const archiveExts = new Set(["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "zst"]);
	const audioExts = new Set(["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a"]);
	const videoExts = new Set(["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv"]);
	const codeExts = new Set([
		"js",
		"jsx",
		"ts",
		"tsx",
		"html",
		"htm",
		"css",
		"scss",
		"py",
		"rb",
		"php",
		"java",
		"go",
		"rs",
		"c",
		"cpp",
		"h",
		"swift",
		"kt",
		"dart",
		"lua",
		"pl",
		"r",
	]);
	const docExts = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"]);
	const dataExts = new Set(["json", "xml", "yml", "yaml", "csv", "toml", "ini", "cfg", "sql"]);
	const textExts = new Set(["txt", "md", "rst", "tex", "log"]);
	const scriptExts = new Set(["sh", "bash", "zsh", "fish", "bat", "ps1", "exe", "deb", "dmg", "apk"]);

	if (imageExts.has(ext)) return "tabler:photo";
	if (archiveExts.has(ext)) return "tabler:file-zip";
	if (audioExts.has(ext)) return "tabler:file-music";
	if (videoExts.has(ext)) return "tabler:video";
	if (codeExts.has(ext)) return "tabler:file-code";
	if (docExts.has(ext)) return "tabler:file-text";
	if (dataExts.has(ext)) return "tabler:file-code";
	if (textExts.has(ext)) return "tabler:file-text";
	if (scriptExts.has(ext)) return "tabler:terminal";

	return "tabler:file";
}

export function RoomFileItem({ file, onDownload, onPreview }: Props) {
	const { locale } = useI18n();
	const ext = getFileExtension(file.fileName);

	function handleClick() {
		if (file.kind === "text") {
			onPreview(file);
		} else {
			onDownload(file);
		}
	}

	return (
		<tr className="room-file-row" onClick={handleClick}>
			<td className="room-file-td-name">
				<Icon icon={getFileIcon(file.fileName)} className="room-file-icon" />
				<span className="room-file-name-text">{file.fileName}</span>
			</td>
			<td className="room-file-td-type">{ext || (file.kind === "text" ? "TEXT" : "FILE")}</td>
			<td className="room-file-td-size">{formatBytes(file.size)}</td>
			<td className="room-file-td-time">{formatTime(file.createdAt, locale)}</td>
		</tr>
	);
}
