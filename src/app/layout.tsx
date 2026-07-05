import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { WorkstationShell } from "@/components/workstation/workstation-shell";
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

  return (
    <html
      lang="en"
      className={`${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <WorkstationShell
          currentRole={profile?.role}
          isAuthenticated={Boolean(user)}
        >
          {children}
        </WorkstationShell>
        <Toaster />
      </body>
    </html>
  );
}
