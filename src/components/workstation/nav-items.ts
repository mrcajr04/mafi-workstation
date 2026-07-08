import { RoleType } from "@prisma/client";

export type NavItem = {
  href: string;
  label: string;
  roles?: RoleType[];
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Scenario Desk", href: "/scenario-desk" },
  { label: "Mortgage Calculators", href: "/calculators" },
  {
    label: "Marketing",
    href: "/marketing",
    roles: [RoleType.BDR, RoleType.LICENSED_LO, RoleType.OWNER],
  },
  { label: "Loan Pre-Approval", href: "/phase4" },
  { label: "Loan Terms Library", href: "/loan-terms-library" },
  // Unbuilt modules: re-enable once each route has a working page.
  // { label: "Loan Estimate", href: "#" },
  // { label: "Loan Search", href: "#" },
  // { label: "Step by Step Process", href: "#" },
  // Social Media/Marketing and Landing Page Setup are unified as /marketing.
  { label: "Settings", href: "/settings" },
  {
    label: "Manage Users",
    href: "/admin/users",
    roles: [RoleType.OWNER],
  },
  {
    label: "Automation Settings",
    href: "/admin/automation-settings",
    roles: [RoleType.OWNER],
  },
  {
    label: "Email Templates",
    href: "/admin/email-templates",
    roles: [RoleType.OWNER],
  },
  {
    label: "Audit Log",
    href: "/audit-log",
    roles: [RoleType.COMPLIANCE_OFFICER, RoleType.OWNER],
  },
];
