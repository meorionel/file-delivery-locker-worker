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

	return (
		<span className="inline-flex w-fit flex-none items-center rounded-full bg-[var(--primary)] px-3 py-[5px] text-[13px] leading-[1.4] font-medium text-[var(--on-primary)]">
			{children}
		</span>
	);
}
