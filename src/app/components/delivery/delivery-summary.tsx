"use client";

import { useI18n } from "@/app/i18n";
import { formatBytes, formatTime } from "@/app/components/locker-format";
import type { Delivery, TextPreview } from "@/app/components/locker-types";
import { Mini } from "@/app/components/mini";

type DeliverySummaryProps = {
  delivery: Delivery;
  textPreview?: TextPreview | null;
  statusText?: Record<Delivery["status"], string>;
  variant?: "locker" | "guest";
};

export function DeliverySummary({ delivery, textPreview, statusText, variant = "locker" }: DeliverySummaryProps) {
  const { t, locale } = useI18n();
  const statusLabel = statusText?.[delivery.status] ?? delivery.status;

  const remainingLabel = (() => {
    if (delivery.maxDownloads === 0) return t("common.unlimited");
    const remaining =
      delivery.kind === "text" && textPreview
        ? textPreview.remainingDownloads
        : delivery.remainingDownloads;
    return `${remaining ?? 0}/${delivery.maxDownloads}`;
  })();

  const isGuest = variant === "guest";
  const containerClass = isGuest
    ? "flex flex-col gap-4"
    : "min-w-0 w-full border-t border-[rgba(250,249,245,0.1)] pt-[18px] flex flex-col gap-4";
  const fileNameClass = isGuest ? "m-0 text-[var(--ink)] text-xl font-medium leading-[1.35] truncate" : "truncate font-semibold";
  const statusPillClass = isGuest
    ? `status-pill guest-status-pill guest-status-${delivery.status} flex-none rounded-full px-2.5 py-[5px]`
    : "status-pill flex-none rounded-full px-2.5 py-[5px]";
  const gridClass = isGuest
    ? "grid grid-cols-2 gap-3 text-sm"
    : "grid grid-cols-2 gap-3 text-sm";

  return (
    <div className={containerClass}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={fileNameClass}>{delivery.fileName}</p>
          <p className="panel-copy mt-1">{formatBytes(delivery.size)}</p>
        </div>
        <span className={statusPillClass}>
          {statusLabel}
        </span>
      </div>
      <div className={gridClass}>
        {isGuest && (
          <Mini label={t("guest.status")} value={statusLabel} />
        )}
        <Mini
          label={t("pickup.remaining")}
          value={remainingLabel}
        />
        <Mini
          label={t("pickup.expires")}
          value={formatTime(delivery.expiresAt, locale, t("common.forever"))}
        />
        {isGuest && (
          <Mini label={t("guest.size")} value={formatBytes(delivery.size)} />
        )}
      </div>
    </div>
  );
}
