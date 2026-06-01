"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault();
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
    <div className="grid gap-6 min-[960px]:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] min-[960px]:items-start">
      <div className="panel panel-feature flex flex-col gap-6">
        <h2>{t("room.createRoom")}</h2>
        <p className="panel-copy">{t("room.fileList")}</p>
        <PrimaryButton type="button" disabled={creating || demoMode} onClick={handleCreate}>
          {creating ? t("room.creating") : t("room.createRoom")}
        </PrimaryButton>
      </div>

      <form className="panel panel-dark flex flex-col items-center gap-5" onSubmit={handleJoin}>
        <h2>{t("room.joinRoom")}</h2>
        <p className="panel-copy">{t("room.enterRoomCode")}</p>
        <div className="field flex w-full flex-col gap-2">
          <span>{t("room.roomCode")}</span>
          <input
            className="w-full text-center text-lg font-semibold tracking-widest uppercase"
            value={joinCode}
            onChange={(e) => {
              const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
              setJoinCode(val);
            }}
            placeholder="ABC123"
            maxLength={6}
            disabled={joining || demoMode}
          />
        </div>
        <SecondaryButton
          type="submit"
          disabled={joining || demoMode || joinCode.replace(/[^A-Za-z0-9]/g, "").length !== 6}
        >
          {joining ? t("room.joining") : t("room.joinRoom")}
        </SecondaryButton>
      </form>

      {error && <p className="auth-error col-span-full text-center">{error}</p>}
    </div>
  );
}
