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
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={`admin-modal ${dark ? "panel-dark" : ""}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="panel-copy">{subtitle}</p>}
          </div>
          <button className="secondary-button admin-modal-close" type="button" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
