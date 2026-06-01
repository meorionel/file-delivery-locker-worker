import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoMode, getSiteAuthSession, getSitePassword, SITE_AUTH_COOKIE } from "@/lib/locker";
import { RoomGate } from "../components/room/room-gate";

export default async function RoomPage() {
  const demoMode = await getDemoMode();
  if (demoMode) {
    return (
      <main className="app-shell min-h-screen">
        <section className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-10 px-5 pt-6 pb-16 sm:px-8 min-[960px]:px-10 max-sm:gap-8 max-sm:pt-4">
          <RoomGate demoMode={demoMode} />
        </section>
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
    <main className="app-shell min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col gap-10 px-5 pt-6 pb-16 sm:px-8 min-[960px]:px-10 max-sm:gap-8 max-sm:pt-4">
        <RoomGate demoMode={demoMode} />
      </section>
    </main>
  );
}
