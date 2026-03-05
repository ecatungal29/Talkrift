"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useContactsStore } from "@/store/contactsStore";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function usePresence() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [retryCount, setRetryCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const ws = new WebSocket(`${WS_BASE}/ws/presence/?token=${accessToken}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "presence") {
          useContactsStore.getState().updateOnlineStatus(data.user_id, data.is_online);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = (e) => {
      if (e.code === 1000 || e.code === 4001) return;
      setTimeout(() => setRetryCount((n) => n + 1), 3000);
    };

    return () => {
      ws.close(1000);
      wsRef.current = null;
    };
  }, [accessToken, retryCount]);
}
