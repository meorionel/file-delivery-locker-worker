export function Mini({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-lg bg-[var(--surface-dark-elevated)] px-3 py-2.5 text-[var(--on-dark)]">
			<p className="m-0 text-xs leading-[1.4] text-[var(--muted-soft)]">{label}</p>
			<strong className="mt-1 block text-base leading-tight font-medium text-inherit">{value}</strong>
		</div>
	);
}
