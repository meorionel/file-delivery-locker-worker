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
		<div className="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(20,20,19,0.42)] p-6 max-sm:items-end max-sm:p-3" role="presentation" onMouseDown={onClose}>
			<section
				aria-modal="true"
				className={`flex max-h-[min(720px,calc(100vh-48px))] w-full max-w-[min(720px,100%)] flex-col gap-6 overflow-y-auto rounded-xl border border-[var(--hairline)] bg-[var(--canvas)] p-8 text-[var(--ink)] shadow-[0_28px_80px_rgba(20,20,19,0.24)] max-sm:max-h-[calc(100vh-24px)] max-sm:p-6 ${dark ? "panel-dark" : ""}`}
				role="dialog"
				onMouseDown={(event) => event.stopPropagation()}
			>
				<div className="flex items-start justify-between gap-4">
					<div>
						<h2 className="m-0 text-[34px] leading-[1.15] font-[var(--font-display)] font-normal">{title}</h2>
						{subtitle && <p className="panel-copy">{subtitle}</p>}
					</div>
					<button className="secondary-button h-10 w-10 flex-none rounded-full p-0 text-[20px] leading-none" type="button" aria-label={closeLabel} onClick={onClose}>
						×
					</button>
				</div>
				{children}
			</section>
		</div>
	);
}
