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
    <div className="room-switch-wrap">
      {leftLabel && (
        <span className={`room-switch-label ${!checked ? "room-switch-label-active" : ""}`}>
          {leftLabel}
        </span>
      )}
      <button
        type="button"
        className="switch-track"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? "Toggle"}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className={`switch-thumb ${checked ? "switch-thumb-on" : ""}`} />
      </button>
      {rightLabel && (
        <span className={`room-switch-label ${checked ? "room-switch-label-active" : ""}`}>
          {rightLabel}
        </span>
      )}
    </div>
  );
}
