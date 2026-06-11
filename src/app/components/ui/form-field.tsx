"use client";

import type { ReactNode } from "react";

type FormFieldProps = {
	label: string;
	children: ReactNode;
};

export function FormField({ label, children }: FormFieldProps) {
	return (
		<label className="field flex flex-col gap-2">
			<span>{label}</span>
			{children}
		</label>
	);
}
