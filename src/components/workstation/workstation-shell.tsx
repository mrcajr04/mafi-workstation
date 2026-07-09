import type { ReactNode } from "react";
import { RoleType } from "@prisma/client";
import { MobileNav } from "@/components/workstation/mobile-nav";
import { SidebarNav } from "@/components/workstation/sidebar-nav";
import { SignOutButton } from "@/components/workstation/sign-out-button";
import type { NavBadgeCounts } from "@/lib/nav-notifications";

type WorkstationShellProps = {
  children: ReactNode;
  currentRole?: RoleType | null;
  hideAppChrome?: boolean;
  hideSidebar?: boolean;
  isAuthenticated: boolean;
  navBadgeCounts?: NavBadgeCounts;
};

export function WorkstationShell({
  children,
  currentRole,
  hideAppChrome = false,
  hideSidebar = false,
  isAuthenticated,
  navBadgeCounts,
}: WorkstationShellProps) {
  const showAppChrome = isAuthenticated && !hideAppChrome;
  const showSidebar = showAppChrome && !hideSidebar;

  return (
    <div className="workstation-print-shell min-h-screen">
      {hideAppChrome ? null : (
        <div className="workstation-print-chrome fixed inset-x-0 top-0 z-50">
          <header className="bg-gradient-hero flex h-16 items-center justify-between gap-2 px-3 text-white shadow-sm sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              {showAppChrome ? (
                <MobileNav
                  currentRole={currentRole}
                  navBadgeCounts={navBadgeCounts}
                />
              ) : null}
              <p className="truncate text-base font-semibold tracking-tight sm:text-lg">
                MAFI Workstation
              </p>
            </div>
            {showAppChrome ? (
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <SignOutButton />
              </div>
            ) : null}
          </header>
        </div>
      )}

      {showSidebar ? (
        <SidebarNav currentRole={currentRole} navBadgeCounts={navBadgeCounts} />
      ) : null}

      <main
        className={
          hideAppChrome
            ? "min-h-screen"
            : showSidebar
            ? "workstation-print-main min-h-screen pt-16 md:pl-56"
            : "workstation-print-main min-h-screen pt-16"
        }
      >
        <div className="workstation-print-content p-6">{children}</div>
      </main>
    </div>
  );
}
