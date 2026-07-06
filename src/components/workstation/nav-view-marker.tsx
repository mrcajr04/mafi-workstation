"use client";

import { useEffect } from "react";
import { markCurrentProfileViewed } from "@/lib/actions/nav-notification-actions";

type NavViewMarkerProps = {
  section: "opportunities" | "scenarioDesk";
};

export function NavViewMarker({ section }: NavViewMarkerProps) {
  useEffect(() => {
    const storageKey = `mafi:last-viewed-marker:${section}`;
    const lastMarkedAt = Number(window.sessionStorage.getItem(storageKey) ?? 0);
    const now = Date.now();

    if (now - lastMarkedAt < 60_000) {
      return;
    }

    window.sessionStorage.setItem(storageKey, String(now));
    void markCurrentProfileViewed(section);
  }, [section]);

  return null;
}
