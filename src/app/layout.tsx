import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { headers } from "next/headers";
import { Toaster } from "@/components/ui/sonner";
import { PasswordSetupGate } from "@/components/workstation/password-setup-gate";
import { WorkstationShell } from "@/components/workstation/workstation-shell";
import { getNavBadgeCounts } from "@/lib/nav-notifications";
import { getCurrentProfile, getCurrentUser } from "@/lib/rbac";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-sans",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "MAFI Workstation",
  description: "Mortgage BDR and LO workstation mini-CRM.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;
  const navBadgeCounts = await getNavBadgeCounts(profile);
  const headerStore = await headers();
  const currentPath = headerStore.get("x-current-path");
  const passwordSetupRequired = Boolean(profile?.passwordSetupRequired);
  const hideAppChrome = passwordSetupRequired || currentPath === "/set-password";

  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <WorkstationShell
          currentRole={profile?.role}
          hideAppChrome={hideAppChrome}
          isAuthenticated={Boolean(user)}
          navBadgeCounts={navBadgeCounts}
        >
          {children}
        </WorkstationShell>
        <PasswordSetupGate
          isAuthenticated={Boolean(user)}
          passwordSetupRequired={passwordSetupRequired}
        />
        <Toaster />
      </body>
    </html>
  );
}
