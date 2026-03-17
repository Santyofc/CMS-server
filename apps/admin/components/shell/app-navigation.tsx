"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation } from "@/components/shell/navigation";
import { cx } from "@/lib/ui/cx";

export default function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav">
      {appNavigation.map((item) => {
        const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link key={item.href} href={item.href} className={cx("sidebar-link", active && "sidebar-link-active")}>
            <span>{item.label}</span>
            <small>{item.description}</small>
          </Link>
        );
      })}
    </nav>
  );
}
