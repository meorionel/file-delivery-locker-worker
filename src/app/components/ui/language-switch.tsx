"use client";

import { useI18n } from "@/app/i18n";

export function LanguageSwitch() {
	const { language, setLanguage, t } = useI18n();

	return (
		<div className="flex flex-none flex-wrap items-center justify-end gap-3 max-md:w-full max-md:justify-start" aria-label={t("language.switch")}>
			<span className="text-[13px] leading-[1.4] font-medium text-[var(--on-dark-soft)]">{t("language.label")}</span>
			<div
				className="inline-flex items-center rounded-full border border-[rgba(250,249,245,0.12)] bg-[var(--surface-dark-elevated)] p-[3px]"
				role="group"
				aria-label={t("language.switch")}
			>
				<button
					className={`min-h-[30px] cursor-pointer rounded-full border-0 px-3 text-[13px] leading-none font-medium transition-colors ${
						language === "zh" ? "bg-[var(--canvas)] text-[var(--ink)]" : "bg-transparent text-[var(--on-dark-soft)] hover:text-[var(--on-dark)]"
					}`}
					type="button"
					aria-pressed={language === "zh"}
					onClick={() => setLanguage("zh")}
				>
					{t("language.zh")}
				</button>
				<button
					className={`min-h-[30px] cursor-pointer rounded-full border-0 px-3 text-[13px] leading-none font-medium transition-colors ${
						language === "en" ? "bg-[var(--canvas)] text-[var(--ink)]" : "bg-transparent text-[var(--on-dark-soft)] hover:text-[var(--on-dark)]"
					}`}
					type="button"
					aria-pressed={language === "en"}
					onClick={() => setLanguage("en")}
				>
					{t("language.en")}
				</button>
			</div>
		</div>
	);
}
