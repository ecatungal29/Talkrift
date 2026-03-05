"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useContactsStore } from "@/store/contactsStore";
import { useCallStore } from "@/store/callStore";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function usePresence() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [retryCount, setRetryCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const ws = new WebSocket(`${WS_BASE}/ws/presence/?token=${accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Register the signal sender in callStore so any component can trigger calls
      useCallStore.getState().setSignalSender((type, toUser, data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type, to_user: toUser, ...data }));
        }
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const callStore = useCallStore.getState();

        if (data.type === "presence") {
          useContactsStore.getState().updateOnlineStatus(data.user_id, data.is_online);
        } else if (data.type === "call_invite") {
          callStore.startIncoming(data.room_id, data.from_user);
        } else if (data.type === "call_accept") {
          callStore.setActive();
        } else if (data.type === "call_reject" || data.type === "call_end") {
          callStore.endCall();
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = (e) => {
      useCallStore.getState().setSignalSender(null);
      if (e.code === 1000 || e.code === 4001) return;
      setTimeout(() => setRetryCount((n) => n + 1), 3000);
    };

    return () => {
      ws.close(1000);
      wsRef.current = null;
      useCallStore.getState().setSignalSender(null);
    };
  }, [accessToken, retryCount]);
}
