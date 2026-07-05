import type { ReactNode } from "react";
import { RoleType } from "@prisma/client";
import { InviteUserHeaderButton } from "@/components/workstation/invite-user-header-button";
import { MobileNav } from "@/components/workstation/mobile-nav";
import { SidebarNav } from "@/components/workstation/sidebar-nav";
import { SignOutButton } from "@/components/workstation/sign-out-button";

type WorkstationShellProps = {
  children: ReactNode;
  currentRole?: RoleType | null;
  isAuthenticated: boolean;
};

export function WorkstationShell({
  children,
  currentRole,
  isAuthenticated,
}: WorkstationShellProps) {
  return (
    <div className="min-h-screen">
      <div className="fixed inset-x-0 top-0 z-50">
        <header className="bg-gradient-hero flex h-16 items-center justify-between gap-2 px-3 text-white shadow-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            {isAuthenticated ? <MobileNav currentRole={currentRole} /> : null}
            <p className="truncate text-base font-semibold tracking-tight sm:text-lg">
              MAFI Workstation
            </p>
          </div>
          {isAuthenticated ? (
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              {currentRole === RoleType.OWNER ? (
                <InviteUserHeaderButton />
              ) : null}
              <SignOutButton />
            </div>
          ) : null}
        </header>
      </div>

      {isAuthenticated ? <SidebarNav currentRole={currentRole} /> : null}

      <main className="min-h-screen pt-16 md:pl-72">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
