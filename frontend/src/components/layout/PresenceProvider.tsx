"use client";

import { useEffect } from "react";
import { usePresence } from "@/hooks/usePresence";

export function PresenceProvider() {
  usePresence();

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return null;
}
