"use client";

import { RoleType } from "@prisma/client";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/workstation/sidebar-nav";

type MobileNavProps = {
  currentRole?: RoleType | null;
};

export function MobileNav({ currentRole }: MobileNavProps) {
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

                return (
                  <Link
                    className={cn(
                      "block rounded-md px-3 py-3 text-sm font-medium text-mafi-text-dark hover:bg-mafi-bg-lighter hover:text-mafi-blue-primary",
                      isActive &&
                        "bg-mafi-blue-primary font-semibold text-white hover:bg-mafi-blue-primary hover:text-white",
                    )}
                    href={item.href}
                    key={item.label}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
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
