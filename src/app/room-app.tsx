"use client";

import { useState } from "react";
import { useI18n } from "./i18n";
import { RoomGate } from "./components/room/room-gate";
import { RoomView } from "./components/room/room-view";

type Props = {
  demoMode: boolean;
};

export default function RoomApp({ demoMode }: Props) {
  const { t } = useI18n();
  const [roomCode, setRoomCode] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [busy, setBusy] = useState(false);

  function handleCreateRoom(code: string, token: string) {
    setRoomCode(code);
    setJoinToken(token);
  }

  function handleJoinRoom(code: string, token: string) {
    setRoomCode(code);
    setJoinToken(token);
  }

  if (!roomCode || !joinToken) {
    return (
      <RoomGate
        busy={busy}
        demoMode={demoMode}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  return <RoomView roomCode={roomCode} joinToken={joinToken} />;
}
