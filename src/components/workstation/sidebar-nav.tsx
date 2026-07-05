"use client";

import { RoleType } from "@prisma/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  roles?: RoleType[];
};

export const navItems: NavItem[] = [
  { label: "Opportunities", href: "/opportunities" },
  { label: "Scenario Desk", href: "/scenario-desk" },
  { label: "Mortgage Calculators", href: "#" },
  { label: "Loan Pre-Approval", href: "/phase4" },
  { label: "Loan Estimate", href: "#" },
  { label: "Loan Search", href: "#" },
  { label: "Step by Step Process", href: "#" },
  { label: "Loan Terms Library", href: "#" },
  { label: "Social Media/Marketing", href: "#" },
  { label: "Landing Page Setup", href: "#" },
  { label: "Settings", href: "/settings" },
  {
    label: "Audit Log",
    href: "/audit-log",
    roles: [RoleType.COMPLIANCE_OFFICER, RoleType.OWNER],
  },
];

type SidebarNavProps = {
  currentRole?: RoleType | null;
};

export function SidebarNav({ currentRole }: SidebarNavProps) {
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
    <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-72 shrink-0 overflow-y-auto border-r border-mafi-border bg-mafi-bg-light px-4 py-5 text-mafi-text-dark md:block">
      <nav aria-label="Workstation navigation" className="space-y-1">
        {visibleNavItems.map((item) => {
          const isActive =
            item.href !== "#" &&
            (pathname === item.href || pathname.startsWith(`${item.href}/`));

          return (
            <Link
              className={cn(
                "block rounded-md px-3 py-2 text-sm font-medium text-mafi-text-dark hover:bg-mafi-bg-lighter hover:text-mafi-blue-primary",
                isActive &&
                  "bg-mafi-blue-primary font-semibold text-white hover:bg-mafi-blue-primary hover:text-white",
              )}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
