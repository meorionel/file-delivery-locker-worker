"use client";

import { type FormEvent, useState } from "react";
import { GooeyToaster } from "goey-toast";
import { notify } from "@/lib/notify";
import { useI18n } from "../i18n";
import { readApiJson } from "../components/api-json";
import { PrimaryButton } from "@/app/components/ui/button";
import { FormField } from "@/app/components/ui/form-field";

type AuthResponse = {
	error?: string;
};

export default function AdminLogin() {
	const { t } = useI18n();
	const [password, setPassword] = useState("");
	const [busy, setBusy] = useState(false);

	async function enterAdmin(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);

		try {
			const response = await fetch("/api/admin/auth", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({ password }),
			});
			await readApiJson<AuthResponse>(response, t("auth.adminPasswordIncorrect"));
			if (!response.ok) {
				throw new Error(t("auth.adminPasswordIncorrect"));
			}

			window.location.reload();
		} catch (authError) {
			notify(authError instanceof Error ? authError.message : t("auth.adminPasswordIncorrect"), "error");
		} finally {
			setBusy(false);
		}
	}

	return (
		<main className="app-shell min-h-screen">
			<section className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col items-center justify-center gap-10 px-5 pt-6 pb-16 min-[960px]:px-10 sm:px-8">
				<form className="panel panel-feature flex w-[min(100%,420px)] flex-col gap-5" onSubmit={enterAdmin}>
					<h2>{t("admin.title")}</h2>
					<FormField label={t("auth.adminPassword")}>
						<input
							className="h-[42px] w-full"
							autoComplete="current-password"
							autoFocus
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
						/>
					</FormField>
					<PrimaryButton disabled={busy} type="submit">
						{busy ? t("auth.verifying") : t("auth.enterAdmin")}
					</PrimaryButton>
				</form>
			</section>
			<GooeyToaster closeButton="top-right" position="bottom-right" preset="subtle" showProgress visibleToasts={3} />
		</main>
	);
}
