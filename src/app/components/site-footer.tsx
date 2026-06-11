"use client";

import { useI18n } from "../i18n";
import { LanguageSwitch } from "@/app/components/ui/language-switch";

export function SiteFooter() {
	const { t } = useI18n();

	return (
		<div className="bg-[var(--surface-dark)] px-5 pt-14 pb-10 text-[var(--on-dark-soft)] max-md:pt-10 max-md:pb-8" role="contentinfo">
			<div className="mx-auto flex max-w-[1200px] items-start justify-between gap-8 max-md:flex-col max-md:gap-7">
				<div className="flex max-w-[520px] items-start gap-3.5">
					<img src="/logo.webp" alt="logo" className="w-16" />
					<div>
						<strong className="block text-[22px] leading-[1.3] font-medium text-[var(--on-dark)]">{t("footer.brand")}</strong>
						<p className="mt-2 mb-0 text-sm leading-[1.55]">{t("footer.copy")}</p>
					</div>
				</div>

				<LanguageSwitch />
			</div>
			<div className="mx-auto mt-10 mb-0 max-w-[1200px] border-t border-[rgba(250,249,245,0.1)] pt-5 text-sm leading-[1.55]">
				<ul>
					<li>
						<a href="https://github.com/meorionel/file-delivery-locker-worker" className="border-[rgba(250,249,245,0.1)] hover:border-b">
							Open Source
						</a>
					</li>
				</ul>
			</div>
		</div>
	);
}
