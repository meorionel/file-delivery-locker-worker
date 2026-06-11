"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { GooeyToaster, gooeyToast } from "goey-toast";
import { readApiJson } from "../../components/api-json";
import type { ApiError, Delivery, DeliveryLookupResult, TextPreview } from "../../components/locker-types";
import { useI18n } from "../../i18n";
import { getDownloadFileName } from "@/lib/file";
import { solvePowToken } from "@/lib/pow";
import { notify } from "@/lib/notify";
import { PrimaryButton } from "@/app/components/ui/button";
import { DeliverySummary } from "@/app/components/delivery/delivery-summary";
import { TextPreviewBlock } from "@/app/components/delivery/text-preview-block";

type GuestDownloadPageProps = {
	guestToken: string;
};

export default function GuestDownloadPage({ guestToken }: GuestDownloadPageProps) {
	const { t } = useI18n();
	const [delivery, setDelivery] = useState<Delivery | null>(null);
	const [loadError, setLoadError] = useState("");
	const [loading, setLoading] = useState(true);
	const [textPreview, setTextPreview] = useState<TextPreview | null>(null);
	const [busy, setBusy] = useState(false);
	const [powStatus, setPowStatus] = useState("");
	const statusText: Record<Delivery["status"], string> = {
		available: t("status.available"),
		deleted: t("status.deleted"),
		depleted: t("status.depleted"),
		expired: t("status.expired"),
	};

	const loadGuestDelivery = useCallback(async () => {
		if (!/^[a-fA-F0-9]{64}$/.test(guestToken)) {
			setDelivery(null);
			setLoadError(t("guest.invalidLink"));
			setLoading(false);
			return;
		}

		setLoading(true);
		setLoadError("");
		try {
			const response = await fetch(`/api/deliveries/guest/${encodeURIComponent(guestToken)}`);
			const data = await readApiJson<ApiError & Pick<DeliveryLookupResult, "delivery">>(response, t("message.queryFailed"));
			if (!response.ok) {
				throw new Error(data.error || t("message.queryFailed"));
			}

			setDelivery(data.delivery);
		} catch (error) {
			setDelivery(null);
			setLoadError(error instanceof Error ? error.message : t("message.queryFailed"));
		} finally {
			setLoading(false);
		}
	}, [guestToken, t]);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			void loadGuestDelivery();
		}, 0);
		return () => window.clearTimeout(timer);
	}, [loadGuestDelivery]);

	async function openGuestDelivery() {
		gooeyToast.dismiss();

		if (!/^[a-fA-F0-9]{64}$/.test(guestToken)) {
			notify(t("guest.invalidLink"), "error");
			return;
		}

		setBusy(true);
		setPowStatus(t("message.powInitial"));
		try {
			if (!delivery) {
				throw new Error(t("message.queryFailed"));
			}

			const capToken = await solvePowToken(t, (progress) => {
				setPowStatus(t("message.powProgress", { progress: Math.round(progress) }));
			});

			if (delivery.kind === "text") {
				setPowStatus(t("guest.loadingText"));
				const response = await fetch(`/api/deliveries/guest/${encodeURIComponent(guestToken)}/preview`, {
					headers: {
						"x-cap-token": capToken,
					},
				});
				const data = await readApiJson<ApiError & TextPreview>(response, t("message.previewFailed"));
				if (!response.ok) {
					throw new Error(data.error || t("message.previewFailed"));
				}

				setTextPreview({
					text: data.text,
					remainingDownloads: data.remainingDownloads,
				});
				void loadGuestDelivery();
				notify(t("guest.textReady"), "success");
				return;
			}

			setPowStatus(t("guest.downloading"));
			const response = await fetch(`/api/deliveries/guest/${encodeURIComponent(guestToken)}/download`, {
				headers: {
					"x-cap-token": capToken,
				},
			});
			if (!response.ok) {
				const data = await readApiJson<ApiError>(response, t("message.downloadFailed"));
				throw new Error(data.error || t("message.downloadFailed"));
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = getDownloadFileName(response.headers.get("content-disposition"), "download");
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.setTimeout(() => URL.revokeObjectURL(url), 1000);
			void loadGuestDelivery();
			notify(t("guest.downloadStarted"), "success");
		} catch (error) {
			notify(error instanceof Error ? error.message : t("message.downloadFailed"), "error");
		} finally {
			setPowStatus("");
			setBusy(false);
		}
	}

	return (
		<main className="app-shell min-h-screen bg-[linear-gradient(180deg,var(--canvas),var(--surface-soft)_66%,var(--canvas))]">
			<section className="mx-auto flex min-h-screen w-full max-w-[860px] flex-col items-center justify-center gap-8 px-5 pt-8 pb-16 sm:px-8">
				<div className="panel panel-feature flex w-full flex-col gap-6 p-[clamp(28px,5vw,48px)] max-sm:p-6">
					<div className="border-b border-[var(--hairline-soft)] pb-7">
						<h2 className="text-[44px] leading-[1.08] tracking-[-0.02em] max-sm:text-[34px]">{t("guest.title")}</h2>
						<p className="panel-copy max-w-[640px] text-base text-[var(--muted)]">{t("guest.copy")}</p>
					</div>
					{loading ? <p className="panel-copy m-0">{t("guest.loading")}</p> : null}
					{loadError ? <p className="auth-error">{loadError}</p> : null}
					{delivery && <DeliverySummary delivery={delivery} statusText={statusText} variant="guest" />}
					{delivery?.kind === "text" && textPreview && (
						<TextPreviewBlock
							text={textPreview.text}
							remainingDownloads={textPreview.remainingDownloads}
							onCopy={(copiedText) => {
								void navigator.clipboard.writeText(copiedText);
								notify(t("common.copy"), "success");
							}}
						/>
					)}
					<PrimaryButton
						className="min-h-12 text-base"
						disabled={busy || loading || !delivery || delivery.status !== "available"}
						type="button"
						onClick={openGuestDelivery}
					>
						<Icon icon={delivery?.kind === "text" ? "tabler:search" : "tabler:download"} aria-hidden="true" />
						{busy ? t("guest.verifying") : delivery?.kind === "text" ? t("guest.viewText") : t("guest.download")}
					</PrimaryButton>
					{powStatus && <p className="panel-copy m-0 text-center">{powStatus}</p>}
				</div>
				<GooeyToaster closeButton="top-right" position="bottom-right" preset="subtle" showProgress visibleToasts={3} />
			</section>
		</main>
	);
}
