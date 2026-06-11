"use client";

import { type ReactNode, useEffect } from "react";
import { useI18n } from "@/app/i18n";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  dark?: boolean;
  children: ReactNode;
};

export function Modal({ open, onClose, title, subtitle, dark = false, children }: ModalProps) {
  const { t } = useI18n();
  const closeLabel = t("common.close");

  useEffect(() => {
    if (!open) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="flex items-center justify-center fixed inset-0 z-60 p-6 bg-[rgba(20,20,19,0.42)] max-sm:items-end max-sm:p-3" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={`bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl shadow-[0_28px_80px_rgba(20,20,19,0.24)] text-[var(--ink)] flex flex-col gap-6 max-h-[min(720px,calc(100vh-48px))] max-w-[min(720px,100%)] overflow-y-auto p-8 w-full max-sm:p-6 max-sm:max-h-[calc(100vh-24px)] ${dark ? "panel-dark" : ""}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 font-[var(--font-display)] text-[34px] font-normal leading-[1.15]">{title}</h2>
            {subtitle && <p className="panel-copy">{subtitle}</p>}
          </div>
          <button className="secondary-button rounded-full flex-none text-[20px] leading-none p-0 w-10 h-10" type="button" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
