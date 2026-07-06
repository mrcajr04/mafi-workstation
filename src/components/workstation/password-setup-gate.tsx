"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

type PasswordSetupGateProps = {
  isAuthenticated: boolean;
  passwordSetupRequired: boolean;
};

export function PasswordSetupGate({
  isAuthenticated,
  passwordSetupRequired,
}: PasswordSetupGateProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (
      isAuthenticated &&
      passwordSetupRequired &&
      pathname !== "/set-password"
    ) {
      router.replace("/set-password");
    }
  }, [isAuthenticated, passwordSetupRequired, pathname, router]);

  return null;
}
