import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoMode, getSiteAuthSession, getSitePassword, SITE_AUTH_COOKIE } from "@/lib/locker";
import { RoomView } from "../../components/room/room-view";
import { RoomViewDemoWrapper } from "../room-client";

export default async function RoomCodePage({ params, searchParams }: { params: Promise<{ roomCode: string }>; searchParams: Promise<{ token?: string }> }) {
	const demoMode = await getDemoMode();
	const { roomCode } = await params;
	const { token: joinToken } = await searchParams;

	if (demoMode) {
		return (
			<main className="app-shell">
				<RoomViewDemoWrapper roomCode={roomCode} />
			</main>
		);
	}

	const sitePassword = await getSitePassword();
	const cookieStore = await cookies();
	const token = cookieStore.get(SITE_AUTH_COOKIE)?.value;
	const session = await getSiteAuthSession(sitePassword, token);

	if (!session.valid) {
		redirect(`/auth?redirect=/room/${encodeURIComponent(roomCode)}`);
	}

	if (!joinToken) {
		redirect("/room");
	}

	return (
		<main className="app-shell">
			<RoomView roomCode={roomCode} joinToken={joinToken} />
		</main>
	);
}
