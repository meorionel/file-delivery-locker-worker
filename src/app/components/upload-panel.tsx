"use client";

import { useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { Icon } from "@iconify/react";
import { useI18n } from "../i18n";
import { CodeBlock } from "./code-block";
import type { DeliveryKind, UploadResult } from "./locker-types";
import { PrimaryButton } from "@/app/components/ui/button";
import { FormField } from "@/app/components/ui/form-field";
import { Badge } from "@/app/components/ui/badge";
import { Switch } from "@/app/components/ui/switch";

const expiryOptions = [
	{ labelKey: "common.forever", value: 0 },
	{ labelKey: "upload.expiry1Hour", value: 1 },
	{ labelKey: "upload.expiry24Hours", value: 24 },
	{ labelKey: "upload.expiry7Days", value: 168 },
] as const;

type UploadPanelProps = {
	busy: boolean;
	demoMode: boolean;
	deliveryMode: DeliveryKind;
	expiresInHours: number;
	maxDownloadsInput: string;
	maxDownloadsUnlimited: boolean;
	guestAccessEnabled: boolean;
	selectedFileName: string | null;
	textContent: string;
	uploadBadge: string;
	uploadResult: UploadResult | null;
	onCopy: (value: string) => void;
	onDeliveryModeChange: (mode: DeliveryKind) => void;
	onExpiresInHoursChange: (value: number) => void;
	onFileChange: (file: File | null) => void;
	onMaxDownloadsInputChange: (value: string) => void;
	onMaxDownloadsUnlimitedChange: (value: boolean) => void;
	onGuestAccessEnabledChange: (value: boolean) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onTextContentChange: (value: string) => void;
	onTextFileChange: (file: File | null) => void;
};

export function UploadPanel({
	busy,
	demoMode,
	deliveryMode,
	expiresInHours,
	maxDownloadsInput,
	maxDownloadsUnlimited,
	guestAccessEnabled,
	selectedFileName,
	textContent,
	uploadBadge,
	uploadResult,
	onCopy,
	onDeliveryModeChange,
	onExpiresInHoursChange,
	onFileChange,
	onMaxDownloadsInputChange,
	onMaxDownloadsUnlimitedChange,
	onGuestAccessEnabledChange,
	onSubmit,
	onTextContentChange,
	onTextFileChange,
}: UploadPanelProps) {
	const { t } = useI18n();
	const [isDragActive, setIsDragActive] = useState(false);

	function hasDroppableData(event: DragEvent<HTMLElement>) {
		if (demoMode) {
			return false;
		}

		return (
			event.dataTransfer.types.includes("Files") ||
			(deliveryMode === "text" && event.dataTransfer.types.includes("text/plain"))
		);
	}

	function handlePanelDragOver(event: DragEvent<HTMLFormElement>) {
		if (!hasDroppableData(event)) {
			return;
		}

		event.preventDefault();
		event.dataTransfer.dropEffect = "copy";
		setIsDragActive(true);
	}

	function handlePanelDragLeave(event: DragEvent<HTMLFormElement>) {
		if (event.currentTarget === event.target || !event.currentTarget.contains(event.relatedTarget as Node | null)) {
			setIsDragActive(false);
		}
	}

	function handlePanelDrop(event: DragEvent<HTMLFormElement>) {
		if (!hasDroppableData(event)) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		setIsDragActive(false);

		const droppedFile = event.dataTransfer.files.item(0);
		if (droppedFile) {
			if (deliveryMode === "text") {
				onTextFileChange(droppedFile);
				return;
			}

			onFileChange(droppedFile);
			return;
		}

		const droppedText = event.dataTransfer.getData("text/plain");
		if (deliveryMode === "text" && droppedText) {
			onTextContentChange(droppedText);
		}
	}

	return (
		<form
			className="panel panel-feature flex flex-col gap-6"
			onDragLeave={handlePanelDragLeave}
			onDragOver={handlePanelDragOver}
			onDrop={handlePanelDrop}
			onSubmit={onSubmit}
		>
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2>{t("upload.title")}</h2>
					<p className="panel-copy">
						{demoMode
							? t("upload.demoCopy")
							: deliveryMode === "text"
								? t("upload.textCopy")
								: selectedFileName ?? t("upload.fileCopy")}
					</p>
				</div>
				<Badge variant="coral">{uploadBadge}</Badge>
			</div>

			<div className="flex justify-center w-full">
				<Switch
					checked={deliveryMode === "text"}
					onChange={() => onDeliveryModeChange(deliveryMode === "text" ? "file" : "text")}
					leftLabel={t("upload.modeFile")}
					rightLabel={t("upload.modeText")}
					ariaLabel={t("upload.switchKind")}
					disabled={demoMode}
				/>
			</div>

			{deliveryMode === "text" ? (
				<div className={`field flex flex-col gap-3 rounded-xl border border-dashed p-2.5 ${isDragActive ? "border-[rgba(204,120,92,0.72)] bg-[var(--surface-soft)]" : "border-transparent"}`}>
					<textarea
						className="block h-[230px] max-h-[230px] max-w-full min-h-[230px] overflow-auto resize-none whitespace-pre-wrap break-words w-full"
						disabled={demoMode}
						value={textContent}
						onChange={(event) => onTextContentChange(event.target.value)}
						placeholder={t("upload.textPlaceholder")}
					/>
					<div className="flex flex-wrap items-center justify-between gap-3">
						<span className="text-[var(--muted)] text-[13px] leading-[1.4]">{t("upload.dropTextFile")}</span>
						<label className="secondary-button inline-flex min-h-9 cursor-pointer items-center justify-center rounded-lg px-4 text-sm font-medium">
							<input
								accept=".txt,.md,.csv,.json,.log,.xml,.yml,.yaml,text/*,application/json"
								className="sr-only"
								disabled={demoMode}
								type="file"
								onChange={(event) => {
									onTextFileChange(event.target.files?.[0] ?? null);
									event.currentTarget.value = "";
								}}
							/>
							{t("upload.chooseTextFile")}
						</label>
					</div>
				</div>
			) : (
				<label className={`flex min-h-[230px] flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed transition-colors duration-[160ms] ${isDragActive ? "border-[var(--primary-active)] bg-[var(--surface-soft)] text-[var(--primary-active)]" : "border-[rgba(204,120,92,0.72)] bg-[var(--canvas)] text-[var(--body-strong)]"} ${demoMode ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-[var(--primary-active)] hover:bg-[var(--surface-soft)] hover:text-[var(--primary-active)]"}`}>
					<input
						className="sr-only"
						disabled={demoMode}
						type="file"
						onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
					/>
					<Icon icon="tabler:file-plus" className="text-4xl" />
					<span className="font-medium">{demoMode ? t("upload.demoNoUpload") : t("upload.chooseFile")}</span>
				</label>
			)}

			<div className="grid gap-4 sm:grid-cols-2">
				<FormField label={t("upload.expiry")}>
					<select
						className="h-[42px] w-full"
						disabled={demoMode}
						value={expiresInHours}
						onChange={(event) => onExpiresInHoursChange(Number(event.target.value))}
					>
						{expiryOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{t(option.labelKey)}
							</option>
						))}
					</select>
				</FormField>
				<FormField label={t("upload.downloadLimit")}>
					<div className="flex min-h-[42px] items-center gap-3">
						<input
							className="h-[42px] min-w-0 flex-1"
							disabled={demoMode || maxDownloadsUnlimited}
							type="number"
							value={maxDownloadsInput}
							onChange={(event) => onMaxDownloadsInputChange(event.target.value)}
						/>
						<label className="inline-flex h-[42px] flex-none items-center gap-2 text-sm">
							<input
								checked={maxDownloadsUnlimited}
								disabled={demoMode}
								type="checkbox"
								onChange={(event) => onMaxDownloadsUnlimitedChange(event.target.checked)}
							/>
							<span>{t("upload.unlimitedTimes")}</span>
						</label>
					</div>
				</FormField>
			</div>

			<label className="field inline-flex min-h-[42px] items-start gap-3">
				<input
					checked={guestAccessEnabled}
					className="mt-1"
					disabled={demoMode}
					type="checkbox"
					onChange={(event) => onGuestAccessEnabledChange(event.target.checked)}
				/>
				<span className="flex flex-col gap-1">
					<span>{t("upload.guestAccess")}</span>
					<small>{t("upload.guestAccessHint")}</small>
				</span>
			</label>

			<PrimaryButton disabled={busy || demoMode} type="submit">
				<Icon icon="tabler:upload" aria-hidden="true" />
				{demoMode ? t("upload.demoReadonly") : busy ? t("upload.uploading") : t("upload.submit")}
			</PrimaryButton>

			{uploadResult && (
				<div className="grid grid-cols-1 gap-3 border-t border-[rgba(20,20,19,0.08)] pt-[18px] sm:grid-cols-2">
					<CodeBlock label={t("upload.pickupCode")} value={uploadResult.pickupCode} onCopy={onCopy} />
					<CodeBlock label={t("upload.manageCode")} value={uploadResult.manageCode} onCopy={onCopy} />
					<CodeBlock label={t("upload.pickupUrl")} value={uploadResult.pickupUrl} onCopy={onCopy} wide />
					{uploadResult.guestDownloadUrl && (
						<CodeBlock label={t("upload.guestDownloadUrl")} value={uploadResult.guestDownloadUrl} onCopy={onCopy} wide />
					)}
				</div>
			)}
		</form>
	);
}
