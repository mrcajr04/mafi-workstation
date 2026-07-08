"use client";

import { RoleType } from "@prisma/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { navItems } from "@/components/workstation/nav-items";
import { cn } from "@/lib/utils";
import type { NavBadgeCounts } from "@/lib/nav-notifications";

type SidebarNavProps = {
  currentRole?: RoleType | null;
  navBadgeCounts?: NavBadgeCounts;
};

export function SidebarNav({ currentRole, navBadgeCounts }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (currentRole && item.roles.includes(currentRole)),
  );

  useEffect(() => {
    visibleNavItems
      .filter((item) => item.href !== "#")
      .forEach((item) => router.prefetch(item.href));
  }, [router, visibleNavItems]);

  return (
    <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-56 shrink-0 overflow-y-auto border-r border-mafi-border bg-mafi-bg-light px-3 py-5 text-mafi-text-dark md:block">
      <nav aria-label="Workstation navigation" className="space-y-1">
        {visibleNavItems.map((item) => {
          const isActive =
            item.href !== "#" &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const badgeCount =
            item.href === "/opportunities" || item.href === "/scenario-desk"
              ? navBadgeCounts?.[item.href]
              : undefined;
          const shouldShowBadge = !isActive && Boolean(badgeCount);

          return (
            <Link
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-mafi-text-dark hover:bg-mafi-bg-lighter hover:text-mafi-blue-primary",
                isActive &&
                  "bg-mafi-blue-primary font-semibold text-white hover:bg-mafi-blue-primary hover:text-white",
              )}
              href={item.href}
              key={item.label}
            >
              <span className="truncate">{item.label}</span>
              {shouldShowBadge ? <NavBadge count={badgeCount ?? 0} /> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

function NavBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-mafi-gold px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
