import type { ReactNode } from "react";
import { RoleType } from "@prisma/client";
import { InviteUserHeaderButton } from "@/components/workstation/invite-user-header-button";
import { MobileNav } from "@/components/workstation/mobile-nav";
import { SidebarNav } from "@/components/workstation/sidebar-nav";
import { SignOutButton } from "@/components/workstation/sign-out-button";
import type { NavBadgeCounts } from "@/lib/nav-notifications";

type WorkstationShellProps = {
  children: ReactNode;
  currentRole?: RoleType | null;
  hideAppChrome?: boolean;
  isAuthenticated: boolean;
  navBadgeCounts?: NavBadgeCounts;
};

export function WorkstationShell({
  children,
  currentRole,
  hideAppChrome = false,
  isAuthenticated,
  navBadgeCounts,
}: WorkstationShellProps) {
  const showAppChrome = isAuthenticated && !hideAppChrome;

  return (
    <div className="min-h-screen">
      {hideAppChrome ? null : (
        <div className="fixed inset-x-0 top-0 z-50">
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
                {currentRole === RoleType.OWNER ? (
                  <InviteUserHeaderButton />
                ) : null}
                <SignOutButton />
              </div>
            ) : null}
          </header>
        </div>
      )}

      {showAppChrome ? (
        <SidebarNav currentRole={currentRole} navBadgeCounts={navBadgeCounts} />
      ) : null}

      <main
        className={
          hideAppChrome ? "min-h-screen" : "min-h-screen pt-16 md:pl-56"
        }
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
