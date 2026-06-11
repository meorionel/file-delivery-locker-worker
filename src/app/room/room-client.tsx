"use client";

import { useEffect, useState } from "react";
import { GooeyToaster } from "goey-toast";
import { RoomView } from "../components/room/room-view";
import { notify } from "@/lib/notify";
import { readApiJson } from "../components/api-json";
import { useI18n } from "../i18n";

export function RoomViewDemoWrapper({ roomCode }: { roomCode: string }) {
	const { t } = useI18n();
	const [joinToken, setJoinToken] = useState<string | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		async function join() {
			try {
				const response = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/join`, {
					method: "POST",
				});
				const data = await readApiJson<{ error?: string; joinToken?: string }>(response, t("message.roomJoinFailed"));
				if (!response.ok || !data.joinToken) {
					throw new Error(data.error ?? t("message.roomJoinFailed"));
				}
				setJoinToken(data.joinToken);
			} catch (err) {
				notify(err instanceof Error ? err.message : t("message.roomJoinFailed"), "error");
				setFailed(true);
			}
		}
		join();
	}, [roomCode, t]);

	if (failed) {
		return (
			<>
				<p>{t("room.connecting")}</p>
				<GooeyToaster closeButton="top-right" position="bottom-right" preset="subtle" showProgress visibleToasts={3} />
			</>
		);
	}

	if (!joinToken) {
		return <p>{t("room.connecting")}</p>;
	}

	return <RoomView roomCode={roomCode} joinToken={joinToken} />;
}
