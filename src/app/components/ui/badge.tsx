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

  return <span className="rounded-full text-[13px] font-medium leading-[1.4] flex-none bg-[var(--primary)] text-[var(--on-primary)] px-3 py-[5px] inline-flex w-fit items-center">{children}</span>;
}
