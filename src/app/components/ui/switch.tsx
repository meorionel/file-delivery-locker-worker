"use client";

type SwitchProps = {
	checked: boolean;
	onChange: (checked: boolean) => void;
	leftLabel?: string;
	rightLabel?: string;
	ariaLabel?: string;
	disabled?: boolean;
};

export function Switch({ checked, onChange, leftLabel, rightLabel, ariaLabel, disabled = false }: SwitchProps) {
	return (
		<div className="flex items-center justify-end gap-2.5">
			{leftLabel && <span className={`text-sm font-medium text-[var(--muted)] transition-colors duration-[160ms] ${!checked ? "text-[var(--ink)]" : ""}`}>{leftLabel}</span>}
			<button
				type="button"
				className="inline-flex h-6 w-12 cursor-pointer rounded-full border-0 bg-[var(--surface-cream-strong)] p-[3px] shadow-[inset_0_0_0_1px_rgba(20,20,19,0.08)] transition-colors duration-[160ms] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgba(204,120,92,0.3)] aria-checked:bg-[rgba(204,120,92,0.22)]"
				role="switch"
				aria-checked={checked}
				aria-label={ariaLabel ?? "Toggle"}
				disabled={disabled}
				onClick={() => onChange(!checked)}
			>
				<span
					className={`block h-[18px] w-[18px] rounded-full bg-[var(--primary)] shadow-[0_2px_6px_rgba(20,20,19,0.18)] transition-transform duration-[160ms] ${checked ? "translate-x-6" : ""}`}
				/>
			</button>
			{rightLabel && <span className={`text-sm font-medium text-[var(--muted)] transition-colors duration-[160ms] ${checked ? "text-[var(--ink)]" : ""}`}>{rightLabel}</span>}
		</div>
	);
}
