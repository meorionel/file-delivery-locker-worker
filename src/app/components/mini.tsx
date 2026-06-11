export function Mini({ label, value }: { label: string; value: string }) {
	return (
		<div className="bg-[var(--surface-dark-elevated)] text-[var(--on-dark)] rounded-lg px-3 py-2.5">
			<p className="m-0 text-[var(--muted-soft)] text-xs leading-[1.4]">{label}</p>
			<strong className="text-inherit text-base font-medium leading-tight mt-1 block">{value}</strong>
		</div>
	);
}
