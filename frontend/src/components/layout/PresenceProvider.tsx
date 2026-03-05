"use client";

import { usePresence } from "@/hooks/usePresence";

export function PresenceProvider() {
  usePresence();
  return null;
}
