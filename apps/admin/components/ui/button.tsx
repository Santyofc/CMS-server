import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/ui/cx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx("button", `button-${variant}`, className)}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}
