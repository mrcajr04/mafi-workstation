import { RoleType } from "@prisma/client";
import {
  BarChart3,
  BookOpen,
  Calculator,
  FileCheck2,
  Mail,
  Megaphone,
  ScrollText,
  Settings,
  SlidersHorizontal,
  Target,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  roles?: RoleType[];
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: BarChart3 },
  { label: "Opportunities", href: "/opportunities", icon: Target },
  { label: "Scenario Desk", href: "/scenario-desk", icon: Workflow },
  { label: "Loan Estimate", href: "/loan-estimate-design", icon: FileCheck2 },
  { label: "Mortgage Calculators", href: "/calculators", icon: Calculator },
  {
    label: "Marketing",
    href: "/marketing",
    icon: Megaphone,
    roles: [RoleType.BDR, RoleType.LICENSED_LO, RoleType.OWNER],
  },
  { label: "Loan Terms Library", href: "/loan-terms-library", icon: BookOpen },
  // Unbuilt modules: re-enable once each route has a working page.
  // { label: "Loan Estimate", href: "#" },
  // { label: "Loan Search", href: "#" },
  // { label: "Step by Step Process", href: "#" },
  // Social Media/Marketing and Landing Page Setup are unified as /marketing.
  {
    label: "Audit Log",
    href: "/audit-log",
    icon: ScrollText,
    roles: [RoleType.COMPLIANCE_OFFICER, RoleType.OWNER],
  },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const settingsNavItems: NavItem[] = [
  { label: "Profile", href: "/settings", icon: Settings },
  {
    label: "Manage Users",
    href: "/admin/users",
    icon: Users,
    roles: [RoleType.OWNER],
  },
  {
    label: "Automation Settings",
    href: "/admin/automation-settings",
    icon: SlidersHorizontal,
    roles: [RoleType.OWNER],
  },
  {
    label: "Email Templates",
    href: "/admin/email-templates",
    icon: Mail,
    roles: [RoleType.OWNER],
  },
];

export function isSettingsPath(pathname: string) {
  return (
    pathname === "/settings" ||
    pathname.startsWith("/admin/users") ||
    pathname.startsWith("/admin/automation-settings") ||
    pathname.startsWith("/admin/email-templates")
  );
}
