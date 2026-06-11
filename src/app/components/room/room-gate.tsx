"use client";

import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { GooeyToaster } from "goey-toast";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/notify";
import { useI18n } from "@/app/i18n";
import { readApiJson } from "@/app/components/api-json";
import { PrimaryButton } from "@/app/components/ui/button";
import type { JoinResult } from "./room-types";

type Props = {
	demoMode: boolean;
};

function storeRoomTokens(roomCode: string, refreshToken: string, expiresAt: string): void {
	try {
		sessionStorage.setItem(`room-refresh-token:${roomCode}`, refreshToken);
		sessionStorage.setItem(`room-expires-at:${roomCode}`, expiresAt);
	} catch {
		// sessionStorage may be unavailable
	}
}

export function RoomGate({ demoMode }: Props) {
	const router = useRouter();
	const { t } = useI18n();
	const [joinCode, setJoinCode] = useState("");
	const [creating, setCreating] = useState(false);
	const [joining, setJoining] = useState(false);

	const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
	const chars = Array.from({ length: 6 }, (_, index) => joinCode[index] ?? "");

	function normalizeRoomCode(raw: string) {
		return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
	}

	function focusBox(index: number) {
		window.requestAnimationFrame(() => inputRefs.current[index]?.focus());
	}

	function updateFrom(index: number, rawValue: string) {
		const nextInput = normalizeRoomCode(rawValue);
		const nextChars = [...chars];

		if (!nextInput) {
			nextChars[index] = "";
			setJoinCode(nextChars.join(""));
			return;
		}

		for (let offset = 0; offset < nextInput.length && index + offset < 6; offset += 1) {
			nextChars[index + offset] = nextInput[offset];
		}

		setJoinCode(nextChars.join("").slice(0, 6));
		focusBox(Math.min(index + nextInput.length, 5));
	}

	function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "Backspace" && !chars[index] && index > 0) {
			event.preventDefault();
			const nextChars = [...chars];
			nextChars[index - 1] = "";
			setJoinCode(nextChars.join(""));
			focusBox(index - 1);
			return;
		}

		if (event.key === "ArrowLeft" && index > 0) {
			event.preventDefault();
			focusBox(index - 1);
			return;
		}

		if (event.key === "ArrowRight" && index < 5) {
			event.preventDefault();
			focusBox(index + 1);
		}
	}

	function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
		const pastedCode = normalizeRoomCode(event.clipboardData.getData("text"));
		if (!pastedCode) {
			return;
		}

		event.preventDefault();
		updateFrom(index, pastedCode);
	}

	async function handleCreate() {
		if (demoMode) return;
		setCreating(true);
		try {
			const response = await fetch("/api/rooms", { method: "POST" });
			const data = await readApiJson<{ error?: string; code?: string }>(response, t("message.roomCreateFailed"));
			if (!response.ok || !data.code) {
				throw new Error(data.error ?? t("message.roomCreateFailed"));
			}

			const joinResp = await fetch(`/api/rooms/${encodeURIComponent(data.code)}/join`, { method: "POST" });
			const joinData = await readApiJson<JoinResult>(joinResp, t("message.roomJoinFailed"));
			if (!joinResp.ok || !joinData.joinToken) {
				throw new Error((joinData as { error?: string }).error ?? t("message.roomJoinFailed"));
			}

			storeRoomTokens(data.code, joinData.refreshToken, joinData.expiresAt);
			router.push(`/room/${encodeURIComponent(data.code)}?token=${encodeURIComponent(joinData.joinToken)}`);
		} catch (err) {
			notify(err instanceof Error ? err.message : t("message.roomCreateFailed"), "error");
		} finally {
			setCreating(false);
		}
	}

	async function handleJoin(event: React.FormEvent) {
		event.preventDefault();
		if (demoMode) return;
		const code = joinCode
			.toUpperCase()
			.replace(/[^A-Z0-9]/g, "")
			.slice(0, 6);
		if (code.length !== 6) {
			notify(t("room.enterRoomCode"), "error");
			return;
		}

		setJoining(true);
		try {
			const response = await fetch(`/api/rooms/${encodeURIComponent(code)}/join`, { method: "POST" });
			const data = await readApiJson<JoinResult>(response, t("message.roomJoinFailed"));
			if (!response.ok || !data.joinToken) {
				throw new Error((data as { error?: string }).error ?? t("message.roomJoinFailed"));
			}

			storeRoomTokens(code, data.refreshToken, data.expiresAt);
			router.push(`/room/${encodeURIComponent(code)}?token=${encodeURIComponent(data.joinToken)}`);
		} catch (err) {
			notify(err instanceof Error ? err.message : t("message.roomJoinFailed"), "error");
		} finally {
			setJoining(false);
		}
	}

	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<form className="flex flex-col gap-4" onSubmit={handleJoin}>
				<div className="panel panel-feature flex w-full flex-col gap-4">
					<div className="field flex w-full flex-col gap-2">
						<span className="text-sm">{t("room.roomCode")}</span>
						<div className="grid grid-cols-6 gap-2" role="group">
							{chars.map((char, index) => (
								<input
									key={index}
									ref={(element) => {
										inputRefs.current[index] = element;
									}}
									className="min-w-0 p-0 text-center text-lg font-semibold tracking-widest uppercase"
									value={char}
									maxLength={1}
									disabled={joining || demoMode}
									autoCapitalize="characters"
									autoComplete="off"
									inputMode="text"
									type="text"
									onChange={(event) => updateFrom(index, event.target.value)}
									onKeyDown={(event) => handleKeyDown(index, event)}
									onPaste={(event) => handlePaste(index, event)}
								/>
							))}
						</div>
					</div>
					<PrimaryButton type="submit" disabled={joining || demoMode || joinCode.length !== 6}>
						{joining ? (
							t("room.joining")
						) : (
							<>
								{t("room.joinRoom")}
								<Icon icon="tabler:arrow-narrow-right" />
							</>
						)}
					</PrimaryButton>
					<div className="flex items-center gap-3">
						<div className="h-px flex-1 bg-black/10" />
						<span className="text-sm text-[var(--muted)]">OR</span>
						<div className="h-px flex-1 bg-black/10" />
					</div>

					<PrimaryButton type="button" disabled={creating || demoMode} onClick={handleCreate}>
						{creating ? t("room.creating") : t("room.createRoom")}
					</PrimaryButton>
				</div>
			</form>

			<GooeyToaster closeButton="top-right" position="bottom-right" preset="subtle" showProgress visibleToasts={3} />
		</div>
	);
}
