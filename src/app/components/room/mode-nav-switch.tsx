"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/app/i18n";

type Props = {
  currentMode: "locker" | "room";
};

export function ModeNavSwitch({ currentMode }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const isRoom = currentMode === "room";

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
        onClick={() => router.push(isRoom ? "/" : "/room")}
      >
        <span className={`switch-thumb ${isRoom ? "switch-thumb-on" : ""}`} />
      </button>
      <span className={`room-switch-label ${isRoom ? "room-switch-label-active" : ""}`}>
        {t("room.modeSwitch")}
      </span>
    </div>
  );
}
