"use client";

import { useEffect, useState } from "react";
import { RoomView } from "../components/room/room-view";
import { readApiJson } from "../components/api-json";
import { useI18n } from "../i18n";

export function RoomViewDemoWrapper({ roomCode }: { roomCode: string }) {
  const { t } = useI18n();
  const [joinToken, setJoinToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function join() {
      try {
        const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/join`, {
          method: "POST",
        });
        const data = await readApiJson<{ error?: string; joinToken?: string }>(
          response,
          t("message.roomJoinFailed")
        );
        if (!response.ok || !data.joinToken) {
          throw new Error(data.error ?? t("message.roomJoinFailed"));
        }
        setJoinToken(data.joinToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("message.roomJoinFailed"));
      }
    }
    join();
  }, [roomCode, t]);

  if (error) {
    return <p className="auth-error">{error}</p>;
  }

  if (!joinToken) {
    return <p>{t("room.connecting")}</p>;
  }

  return <RoomView roomCode={roomCode} joinToken={joinToken} />;
}
