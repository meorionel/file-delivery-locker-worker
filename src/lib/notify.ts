import { gooeyToast } from "goey-toast";

export function notify(message: string, type: "default" | "success" | "error" | "warning" = "default") {
  const options = { preset: "subtle" as const, showTimestamp: false, showProgress: true };

  if (type === "success") {
    gooeyToast.success(message, options);
    return;
  }

  if (type === "error") {
    gooeyToast.error(message, options);
    return;
  }

  if (type === "warning") {
    gooeyToast.warning(message, options);
    return;
  }

  gooeyToast(message, options);
}
