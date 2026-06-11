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
    <div className="flex items-center gap-2.5 justify-end">
      {leftLabel && (
        <span className={`text-[var(--muted)] text-sm font-medium transition-colors duration-[160ms] ${!checked ? "text-[var(--ink)]" : ""}`}>
          {leftLabel}
        </span>
      )}
      <button
        type="button"
        className="border-0 bg-[var(--surface-cream-strong)] shadow-[inset_0_0_0_1px_rgba(20,20,19,0.08)] rounded-full cursor-pointer inline-flex h-6 p-[3px] transition-colors duration-[160ms] w-12 focus-visible:outline-2 focus-visible:outline-[rgba(204,120,92,0.3)] focus-visible:outline-offset-4 aria-checked:bg-[rgba(204,120,92,0.22)]"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? "Toggle"}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className={`bg-[var(--primary)] rounded-full shadow-[0_2px_6px_rgba(20,20,19,0.18)] block h-[18px] transition-transform duration-[160ms] w-[18px] ${checked ? "translate-x-6" : ""}`} />
      </button>
      {rightLabel && (
        <span className={`text-[var(--muted)] text-sm font-medium transition-colors duration-[160ms] ${checked ? "text-[var(--ink)]" : ""}`}>
          {rightLabel}
        </span>
      )}
    </div>
  );
}
