"use client";

import type { FormEvent } from "react";
import { Icon } from "@iconify/react";
import { useI18n } from "../i18n";
import { DangerButton } from "@/app/components/ui/button";

type AdminPanelProps = {
	busy: boolean;
	manageCode: string;
	onManageCodeChange: (value: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function AdminPanel({ busy, manageCode, onManageCodeChange, onSubmit }: AdminPanelProps) {
	const { t } = useI18n();

	return (
		<form className="panel flex w-full flex-col gap-3 self-start bg-[var(--surface-soft)]" onSubmit={onSubmit}>
			<div>
				<h2>{t("admin.manageTitle")}</h2>
				<p className="panel-copy">{t("admin.manageCopy")}</p>
			</div>
			<div className="flex gap-2">
				<div className="field flex flex-1 flex-col gap-2">
					<input
						className="h-[42px] w-full"
						autoCapitalize="characters"
						value={manageCode}
						onChange={(event) => onManageCodeChange(event.target.value.toUpperCase())}
						placeholder={t("admin.managePlaceholder")}
					/>
				</div>
				<DangerButton disabled={busy} type="submit">
					<Icon icon="tabler:trash" aria-hidden="true" />
					{busy ? t("admin.revoking") : t("admin.revokeFile")}
				</DangerButton>
			</div>
		</form>
	);
}
