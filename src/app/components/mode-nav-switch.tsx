"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/app/i18n";
import { Switch } from "@/app/components/ui/switch";

const HIDDEN_PATH_PREFIXES = ["/admin", "/auth", "/guest"] as const;

export function ModeNavSwitch() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const isRoom = pathname.startsWith("/room");

  return (
    <Switch
      checked={isRoom}
      onChange={(next) => router.push(next ? "/room" : "/")}
      leftLabel={t("room.lockerMode")}
      rightLabel={t("room.modeSwitch")}
      ariaLabel={t("room.modeSwitch")}
    />
  );
}
