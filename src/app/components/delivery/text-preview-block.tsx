"use client";

import { useI18n } from "@/app/i18n";

type TextPreviewBlockProps = {
  text?: string;
  remainingDownloads?: number | null;
  onCopy: (text: string) => void;
};

export function TextPreviewBlock({ text, remainingDownloads, onCopy }: TextPreviewBlockProps) {
  const { t } = useI18n();

  return (
    <div className="text-preview flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span>{t("pickup.preview")}</span>
        {text && (
          <small>
            {remainingDownloads === null
              ? t("common.unlimited")
              : t("pickup.remainingTimes", { count: remainingDownloads ?? 0 })}
          </small>
        )}
      </div>
      <pre>{text ?? t("pickup.loadingText")}</pre>
      <button
        className="secondary-button inline-flex min-h-10 items-center justify-center gap-[9px] rounded-lg px-5 text-sm leading-none font-medium no-underline"
        disabled={!text}
        type="button"
        onClick={() => {
          if (text) onCopy(text);
        }}
      >
        <span aria-hidden="true">⧉</span>
        {t("pickup.copyText")}
      </button>
    </div>
  );
}
