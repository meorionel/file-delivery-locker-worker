import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoMode, getSiteAuthSession, getSitePassword, SITE_AUTH_COOKIE } from "@/lib/locker";
import PasswordGate from "../password-gate";

export default async function AuthPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
	const demoMode = await getDemoMode();
	if (demoMode) {
		redirect("/");
	}

	const { redirect: redirectTo } = await searchParams;

	const sitePassword = await getSitePassword();
	const cookieStore = await cookies();
	const token = cookieStore.get(SITE_AUTH_COOKIE)?.value;
	const session = await getSiteAuthSession(sitePassword, token);

	if (session.valid) {
		redirect(redirectTo ?? "/");
	}

	return <PasswordGate redirectTo={redirectTo} />;
}
