import { formatCount } from "./locker-format";
import type { SiteStats } from "./locker-types";
import { useI18n } from "../i18n";

export function StatsLockup({ stats }: { stats: SiteStats | null }) {
	const { t } = useI18n();

	return (
		<div className="inline-grid w-fit grid-cols-[max-content_max-content] gap-10 self-start pt-0.5 [&>:first-child>strong]:text-[#9b513a]" aria-label={t("site.description")}>
			<StatCounter label="UPLOAD" value={stats?.uploadCount} />
			<StatCounter label="DOWNLOAD" value={stats?.downloadCount} />
		</div>
	);
}

function StatCounter({ label, value }: { label: string; value?: number }) {
	return (
		<div className="flex min-w-[104px] flex-col items-start gap-1.5 max-sm:min-w-0">
			<span className="text-sm leading-none font-bold tracking-[0.22em] text-[#9a968d] uppercase max-sm:text-[13px]">{label}</span>
			<strong className="text-[clamp(18px,18px,26px)] leading-none font-[var(--font-body)] font-medium tracking-[0.08em] text-[var(--ink)] max-sm:text-[28px]">
				{typeof value === "number" ? formatCount(value) : "0"}
			</strong>
		</div>
	);
}
