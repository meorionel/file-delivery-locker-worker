"use client";

import { useI18n } from "@/app/i18n";

type Props = {
  value: "locker" | "room";
  onChange: (mode: "locker" | "room") => void;
};

export function TransferModeSwitch({ value, onChange }: Props) {
  const { t } = useI18n();
  const isRoom = value === "room";

  return (
    <div className="room-switch-wrap">
      <span className={`room-switch-label ${!isRoom ? "room-switch-label-active" : ""}`}>
        {t("room.lockerMode")}
      </span>
      <button
        type="button"
        className="switch-track"
        role="switch"
        aria-checked={isRoom}
        aria-label={t("room.modeSwitch")}
        onClick={() => onChange(isRoom ? "locker" : "room")}
      >
        <span className={`switch-thumb ${isRoom ? "switch-thumb-on" : ""}`} />
      </button>
      <span className={`room-switch-label ${isRoom ? "room-switch-label-active" : ""}`}>
        {t("room.modeSwitch")}
      </span>
    </div>
  );
}
