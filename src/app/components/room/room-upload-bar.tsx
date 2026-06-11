"use client";

import { type FormEvent, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { notify } from "@/lib/notify";
import { useI18n } from "@/app/i18n";
import { readApiJson } from "@/app/components/api-json";
import { PrimaryButton } from "@/app/components/ui/button";
import type { DeliveryKind, UploadFileResult } from "./room-types";

type Props = {
	roomCode: string;
	joinToken: string;
	onUploaded: () => void;
};

const MAX_TEXT_SIZE = 256 * 1024;

export function RoomUploadBar({ roomCode, joinToken, onUploaded }: Props) {
	const { t } = useI18n();
	const [kind, setKind] = useState<DeliveryKind>("file");
	const [textContent, setTextContent] = useState("");
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	function toggleKind() {
		setKind(kind === "file" ? "text" : "file");
	}

	async function handleUpload(event: FormEvent) {
		event.preventDefault();

		let body: BodyInit;
		let contentType: string;
		let fileName: string;

		if (kind === "text") {
			if (!textContent.trim()) {
				notify(t("message.enterText"), "error");
				return;
			}
			const textBytes = new TextEncoder().encode(textContent);
			if (textBytes.length > MAX_TEXT_SIZE) {
				notify(t("message.textTooLarge"), "error");
				return;
			}
			body = new Blob([textContent], { type: "text/plain;charset=utf-8" });
			contentType = "text/plain;charset=utf-8";
			fileName = "stored-text.txt";
		} else {
			if (!selectedFile) {
				notify(t("message.chooseFile"), "error");
				return;
			}
			if (selectedFile.size > 100 * 1024 * 1024) {
				notify(t("message.fileTooLarge"), "error");
				return;
			}
			body = selectedFile;
			contentType = selectedFile.type || "application/octet-stream";
			fileName = selectedFile.name;
		}

		setUploading(true);
		try {
			const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/files`, {
				method: "POST",
				headers: {
					"content-type": contentType,
					"x-content-type": contentType,
					"x-delivery-kind": kind,
					"x-file-name": encodeURIComponent(fileName),
					"x-join-token": joinToken,
				},
				body,
			});
			const data = await readApiJson<{ error?: string } & UploadFileResult>(response, t("message.roomUploadFailed"));
			if (!response.ok) {
				throw new Error(data.error ?? t("message.roomUploadFailed"));
			}
			setTextContent("");
			setSelectedFile(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			onUploaded();
		} catch (err) {
			notify(err instanceof Error ? err.message : t("message.roomUploadFailed"), "error");
		} finally {
			setUploading(false);
		}
	}

	function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (file) {
			setSelectedFile(file);
		}
	}

	return (
		<div className="sticky bottom-0 z-50 border-t border-[var(--hairline)] bg-[var(--canvas)] py-3">
			<div className="mx-auto flex w-full max-w-[1200px] items-start gap-6 px-5 min-[960px]:px-10 sm:px-8">
				<button
					type="button"
					className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-[var(--primary)] leading-none text-[var(--on-primary)] transition-colors duration-[120ms] hover:bg-[var(--primary-active)]"
					onClick={toggleKind}
					title={kind === "file" ? t("room.uploadText") : t("room.uploadFile")}
				>
					<Icon icon={kind === "file" ? "tabler:file-text" : "tabler:file"} className="text-lg" />
				</button>

				<form className="flex flex-1 items-start gap-6" onSubmit={handleUpload}>
					{kind === "text" ? (
						<textarea
							className="h-10 min-w-0 flex-1 resize-none rounded-xl border-2 border-dashed border-[var(--hairline)] bg-[var(--canvas)] px-4 py-3 text-sm text-[var(--ink)] transition-colors duration-[120ms] outline-none placeholder:text-[var(--muted-soft)] focus:border-[var(--primary)]"
							value={textContent}
							onChange={(e) => setTextContent(e.target.value)}
							placeholder={t("upload.textPlaceholder")}
							disabled={uploading}
						/>
					) : (
						<label className="flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-between rounded-xl border-2 border-dashed border-[var(--hairline)] bg-[var(--canvas)] px-4 transition-colors duration-[120ms] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]">
							<input ref={fileInputRef} type="file" className="sr-only" onChange={handleFileChange} />
							{selectedFile ? (
								<span className="text-sm text-[var(--ink)]">{selectedFile.name}</span>
							) : (
								<>
									<span className="text-sm text-[var(--muted)]">{t("upload.chooseFile")}</span>
									<Icon icon="tabler:cloud-upload" className="text-xl text-[var(--muted)]" />
								</>
							)}
						</label>
					)}

					<PrimaryButton type="submit" disabled={uploading}>
						{uploading ? (
							t("upload.uploading")
						) : (
							<>
								<Icon icon="tabler:send" />
								Send
							</>
						)}
					</PrimaryButton>
				</form>
			</div>
		</div>
	);
}
