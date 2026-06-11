import type { useI18n } from "@/app/i18n";

type TFunction = ReturnType<typeof useI18n>["t"];

export async function solvePowToken(t: TFunction, onProgress: (progress: number) => void) {
	const capProgressRef = { current: onProgress };

	const { default: Cap } = await import("cap-widget");
	const cap = new Cap({
		apiEndpoint: "/api/pow/",
		"data-cap-worker-count": "1",
		"data-cap-i18n-initial-state": t("message.powWidgetInitial"),
		"data-cap-i18n-verifying-label": t("message.powWidgetVerifying"),
		"data-cap-i18n-solved-label": t("message.powWidgetSolved"),
		"data-cap-i18n-error-label": t("message.powWidgetError"),
	});
	const handleProgress = (event: CustomEvent<{ progress: number }>) => capProgressRef.current(event.detail.progress);
	cap.addEventListener("progress", handleProgress as EventListener);

	try {
		const result = await cap.solve();
		if (!result.success || !result.token) {
			throw new Error(t("message.powFailed"));
		}

		return result.token;
	} finally {
		cap.reset();
		cap.widget.remove();
	}
}
