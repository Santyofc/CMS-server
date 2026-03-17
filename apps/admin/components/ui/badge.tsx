import type { ReactNode } from "react";
import { cx } from "@/lib/ui/cx";

export function Badge({
  tone = "neutral",
  children
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
}) {
  return <span className={cx("badge", `badge-${tone}`)}>{children}</span>;
}
