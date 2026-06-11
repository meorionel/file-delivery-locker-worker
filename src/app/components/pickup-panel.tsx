"use client";

import type { FormEvent } from "react";
import { Icon } from "@iconify/react";
import { useI18n } from "../i18n";
import type { Delivery, TextPreview } from "./locker-types";
import { PickupCodeInput } from "./pickup-code-input";
import { PrimaryButton, SecondaryButton } from "@/app/components/ui/button";
import { DeliverySummary } from "@/app/components/delivery/delivery-summary";
import { TextPreviewBlock } from "@/app/components/delivery/text-preview-block";

type PickupPanelProps = {
	busy: boolean;
	delivery: Delivery | null;
	downloading: boolean;
	pickupCode: string;
	pickupAccessToken: string;
	powStatus: string;
	textPreview: TextPreview | null;
	onCopy: (value: string) => void;
	onDownload: () => void;
	onPickupCodeChange: (value: string) => void;
	onSubmit: (event?: FormEvent<HTMLFormElement>) => void;
};

export function PickupPanel({
	busy,
	delivery,
	downloading,
	pickupCode,
	pickupAccessToken,
	powStatus,
	textPreview,
	onCopy,
	onDownload,
	onPickupCodeChange,
	onSubmit,
}: PickupPanelProps) {
	const { t } = useI18n();
	const statusText: Record<Delivery["status"], string> = {
		available: t("status.available"),
		deleted: t("status.deleted"),
		depleted: t("status.depleted"),
		expired: t("status.expired"),
	};

	return (
		<form className="panel panel-dark flex h-full flex-col items-center justify-center gap-5" onSubmit={onSubmit}>
			<div className="w-full">
				<h2>{t("pickup.title")}</h2>
				<p className="panel-copy">{t("pickup.copy")}</p>
			</div>
			<PickupCodeInput value={pickupCode} onChange={onPickupCodeChange} />
			<SecondaryButton disabled={busy} type="submit">
				<Icon icon="tabler:search" aria-hidden="true" />
				{busy ? t("pickup.searching") : t("pickup.search")}
			</SecondaryButton>
			{powStatus && <p className="panel-copy m-0 text-center">{powStatus}</p>}

			{delivery && (
				<>
					<DeliverySummary delivery={delivery} textPreview={textPreview} statusText={statusText} />
					{delivery.kind === "text" ? (
						delivery.status === "available" ? (
							<TextPreviewBlock text={textPreview?.text} remainingDownloads={textPreview?.remainingDownloads} onCopy={onCopy} />
						) : null
					) : (
						<PrimaryButton disabled={delivery.status !== "available" || !pickupAccessToken || downloading} type="button" onClick={onDownload}>
							<Icon icon="tabler:download" aria-hidden="true" />
							{downloading ? t("pickup.downloading") : t("pickup.download")}
						</PrimaryButton>
					)}
				</>
			)}
		</form>
	);
}
