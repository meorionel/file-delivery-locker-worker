"use client";

import type { ReactNode } from "react";

type BadgeProps = {
  variant: "status" | "coral";
  children: ReactNode;
};

export function Badge({ variant, children }: BadgeProps) {
  if (variant === "status") {
    return <span className="status-pill flex-none rounded-full px-2.5 py-[5px]">{children}</span>;
  }

  return <span className="badge-coral inline-flex w-fit items-center">{children}</span>;
}
