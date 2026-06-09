"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/app/i18n";
import { Switch } from "@/app/components/ui/switch";

const HIDDEN_PATH_PREFIXES = ["/admin", "/auth", "/guest"] as const;

const ROOM_STATE_KEY = "file-delivery-locker-room-state";

type RoomState = {
  roomCode: string;
  token: string;
};

function getRoomState(): RoomState | null {
  try {
    const raw = sessionStorage.getItem(ROOM_STATE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as RoomState;
    if (state.roomCode && state.token) return state;
    return null;
  } catch {
    return null;
  }
}

function saveRoomState(state: RoomState) {
  try {
    sessionStorage.setItem(ROOM_STATE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable
  }
}

export function clearRoomState() {
  try {
    sessionStorage.removeItem(ROOM_STATE_KEY);
  } catch {
    // sessionStorage may be unavailable
  }
}

export function ModeNavSwitch() {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const isRoom = pathname.startsWith("/room");

  function handleChange(next: boolean) {
    if (next) {
      // Switching from locker to room — restore saved state if available
      const saved = getRoomState();
      if (saved) {
        router.push(`/room/${encodeURIComponent(saved.roomCode)}?token=${encodeURIComponent(saved.token)}`);
      } else {
        router.push("/room");
      }
    } else {
      // Switching from room to locker — save current room state
      const match = pathname.match(/^\/room\/([^/]+)/);
      if (match) {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        if (token) {
          saveRoomState({ roomCode: match[1], token });
        }
      }
      router.push("/");
    }
  }

  return (
    <Switch
      checked={isRoom}
      onChange={handleChange}
      leftLabel={t("room.lockerMode")}
      rightLabel={t("room.modeSwitch")}
      ariaLabel={t("room.modeSwitch")}
    />
  );
}
