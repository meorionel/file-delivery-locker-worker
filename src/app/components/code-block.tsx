"use client";

import { useI18n } from "../i18n";

export function CodeBlock({
	label,
	onCopy,
	value,
	wide,
}: {
	label: string;
	onCopy: (value: string) => void;
	value: string;
	wide?: boolean;
}) {
	const { t } = useI18n();

	return (
		<div className={wide ? "flex min-w-0 flex-col gap-[7px] sm:col-span-2" : "flex min-w-0 flex-col gap-[7px]"}>
			<span className="text-[var(--muted)] text-[13px] font-medium leading-[1.4]">{label}</span>
			<button className="min-w-0 break-words border border-[var(--hairline)] rounded-lg bg-[var(--canvas)] p-3 text-left font-[var(--font-code)] text-[13px] leading-normal text-[var(--body-strong)] transition-colors duration-[160ms] hover:border-[var(--primary)] hover:bg-[var(--surface-soft)]" type="button" onClick={() => onCopy(value)} title={t("common.copyNamed", { label })}>
				{value}
			</button>
		</div>
	);
}
