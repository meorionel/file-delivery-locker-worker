"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PickupCodeInput } from "@/app/components/pickup-code-input";
import { useI18n } from "@/app/i18n";
import { readApiJson } from "@/app/components/api-json";
import { PrimaryButton, SecondaryButton } from "@/app/components/ui/button";

type Props = {
  demoMode: boolean;
};

export function RoomGate({ demoMode }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (demoMode) return;
    setError("");
    setCreating(true);
    try {
      const response = await fetch("/api/rooms", { method: "POST" });
      const data = await readApiJson<{ error?: string; code?: string }>(response, t("message.roomCreateFailed"));
      if (!response.ok || !data.code) {
        throw new Error(data.error ?? t("message.roomCreateFailed"));
      }

      // Auto-join after creating
      const joinResp = await fetch(`/api/rooms/${encodeURIComponent(data.code)}/join`, { method: "POST" });
      const joinData = await readApiJson<{ error?: string; joinToken?: string; roomCode?: string }>(
        joinResp,
        t("message.roomJoinFailed")
      );
      if (!joinResp.ok || !joinData.joinToken) {
        throw new Error(joinData.error ?? t("message.roomJoinFailed"));
      }

      router.push(`/room/${encodeURIComponent(data.code)}?token=${encodeURIComponent(joinData.joinToken)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("message.roomCreateFailed"));
    } finally {
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (demoMode) return;
    const code = joinCode.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    if (code.length !== 6) {
      setError(t("room.enterRoomCode"));
      return;
    }

    setError("");
    setJoining(true);
    try {
      const response = await fetch(`/api/rooms/${encodeURIComponent(code)}/join`, { method: "POST" });
      const data = await readApiJson<{ error?: string; joinToken?: string; roomCode?: string }>(
        response,
        t("message.roomJoinFailed")
      );
      if (!response.ok || !data.joinToken) {
        throw new Error(data.error ?? t("message.roomJoinFailed"));
      }

      router.push(`/room/${encodeURIComponent(code)}?token=${encodeURIComponent(data.joinToken)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("message.roomJoinFailed"));
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="panel room-gate">
      <div className="room-gate-section">
        <PrimaryButton
          type="button"
          disabled={creating || demoMode}
          onClick={handleCreate}
        >
          {creating ? t("room.creating") : t("room.createRoom")}
        </PrimaryButton>
      </div>

      <div className="room-gate-divider" />

      <div className="room-gate-section">
        <label className="field-label">{t("room.roomCode")}</label>
        <PickupCodeInput value={joinCode} onChange={setJoinCode} disabled={joining || demoMode} />
        <SecondaryButton
          type="button"
          disabled={joining || demoMode || joinCode.replace(/[^A-Za-z0-9]/g, "").length !== 6}
          onClick={handleJoin}
          style={{ marginTop: "0.75rem" }}
        >
          {joining ? t("room.joining") : t("room.joinRoom")}
        </SecondaryButton>
      </div>

      {error && <p className="room-gate-error">{error}</p>}
    </div>
  );
}
