"use client";

import type { ComponentPropsWithoutRef } from "react";

type ButtonBaseProps = ComponentPropsWithoutRef<"button"> & {
  className?: string;
};

function mergeClass(base: string, className?: string) {
  return className ? `${base} ${className}` : base;
}

export function PrimaryButton({ className, ...props }: ButtonBaseProps) {
  return (
    <button
      className={mergeClass(
        "primary-button inline-flex min-h-10 items-center justify-center gap-[9px] rounded-lg px-5 text-sm leading-none font-medium no-underline",
        className,
      )}
      {...props}
    />
  );
}

export function SecondaryButton({ className, ...props }: ButtonBaseProps) {
  return (
    <button
      className={mergeClass(
        "secondary-button inline-flex min-h-10 items-center justify-center gap-[9px] rounded-lg px-5 text-sm leading-none font-medium no-underline",
        className,
      )}
      {...props}
    />
  );
}

export function DangerButton({ className, ...props }: ButtonBaseProps) {
  return (
    <button
      className={mergeClass(
        "danger-button inline-flex min-h-10 items-center justify-center gap-[9px] rounded-lg px-5 text-sm leading-none font-medium no-underline",
        className,
      )}
      {...props}
    />
  );
}
