"use client";

import { useI18n } from "@/app/i18n";

export function SiteLogo() {
	const { t } = useI18n();

	return (
		<a href="/" className="flex items-center gap-2.5 no-underline">
			<img src="/favicon.ico" alt="" className="h-7 w-7" />
			<span className="text-lg font-semibold text-[var(--body-strong)]">{t("site.title")}</span>
		</a>
	);
}
