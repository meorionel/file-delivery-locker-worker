import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoMode, getSiteAuthSession, getSitePassword, SITE_AUTH_COOKIE } from "@/lib/locker";
import { RoomGate } from "../components/room/room-gate";

export default async function RoomPage() {
  const demoMode = await getDemoMode();
  if (demoMode) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-5">
        <RoomGate demoMode={demoMode} />
      </main>
    );
  }

  const sitePassword = await getSitePassword();
  const cookieStore = await cookies();
  const token = cookieStore.get(SITE_AUTH_COOKIE)?.value;
  const session = await getSiteAuthSession(sitePassword, token);

  if (!session.valid) {
    redirect("/auth?redirect=/room");
  }

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-5">
      <RoomGate demoMode={demoMode} />
    </main>
  );
}
