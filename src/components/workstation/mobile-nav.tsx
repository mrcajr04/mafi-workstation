"use client";

import { RoleType } from "@prisma/client";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/workstation/sidebar-nav";
import type { NavBadgeCounts } from "@/lib/nav-notifications";

type MobileNavProps = {
  currentRole?: RoleType | null;
  navBadgeCounts?: NavBadgeCounts;
};

export function MobileNav({ currentRole, navBadgeCounts }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (currentRole && item.roles.includes(currentRole)),
  );

  useEffect(() => {
    visibleNavItems
      .filter((item) => item.href !== "#")
      .forEach((item) => router.prefetch(item.href));
  }, [router, visibleNavItems]);

  return (
    <>
      <button
        aria-label="Open navigation"
        className="inline-flex size-10 items-center justify-center rounded-md text-white transition hover:bg-white/15 md:hidden"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Menu className="size-6" />
      </button>
      {isOpen ? (
        <div className="fixed inset-0 top-16 z-50 md:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-mafi-text-dark/45"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <aside className="relative h-full w-[min(20rem,calc(100vw-3rem))] overflow-y-auto border-r border-mafi-border bg-mafi-bg-light px-4 py-5 text-mafi-text-dark shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-mafi-blue-primary">
                Menu
              </p>
              <button
                aria-label="Close navigation"
                className="inline-flex size-10 items-center justify-center rounded-md text-mafi-text-dark transition hover:bg-mafi-bg-lighter"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav aria-label="Mobile workstation navigation" className="space-y-1">
              {visibleNavItems.map((item) => {
                const isActive =
                  item.href !== "#" &&
                  (pathname === item.href ||
                    pathname.startsWith(`${item.href}/`));
                const badgeCount =
                  item.href === "/opportunities" || item.href === "/scenario-desk"
                    ? navBadgeCounts?.[item.href]
                    : undefined;
                const shouldShowBadge = !isActive && Boolean(badgeCount);

                return (
                  <Link
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-md px-3 py-3 text-sm font-medium text-mafi-text-dark hover:bg-mafi-bg-lighter hover:text-mafi-blue-primary",
                      isActive &&
                        "bg-mafi-blue-primary font-semibold text-white hover:bg-mafi-blue-primary hover:text-white",
                    )}
                    href={item.href}
                    key={item.label}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="truncate">{item.label}</span>
                    {shouldShowBadge ? <NavBadge count={badgeCount ?? 0} /> : null}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function NavBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-mafi-gold px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}
