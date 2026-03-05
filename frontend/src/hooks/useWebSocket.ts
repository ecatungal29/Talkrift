"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useContactsStore } from "@/store/contactsStore";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function useWebSocket(roomId: number) {
  const wsRef = useRef<WebSocket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [retryCount, setRetryCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!accessToken || !roomId) return;

    const ws = new WebSocket(`${WS_BASE}/ws/chat/${roomId}/?token=${accessToken}`);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const store = useChatStore.getState();
        if (data.type === "message") {
          const msg: import("@/store/chatStore").Message = data.message;
          const currentUser = useAuthStore.getState().user;
          const roomMsgs = store.messages[msg.room] ?? [];

          if (currentUser && msg.sender.id === currentUser.id) {
            // Check if already added via REST response (real ID already in store)
            if (roomMsgs.some((m) => m.id === msg.id)) return;
            // Otherwise find and replace the optimistic entry
            let tempId: number | undefined;
            for (let i = roomMsgs.length - 1; i >= 0; i--) {
              if (roomMsgs[i].id < 0 && roomMsgs[i].content === msg.content) {
                tempId = roomMsgs[i].id;
                break;
              }
            }
            if (tempId !== undefined) {
              store.replaceMessage(tempId, msg);
            } else {
              store.addMessage(msg);
            }
          } else {
            // For the receiver: skip if we somehow already have this message
            if (roomMsgs.some((m) => m.id === msg.id)) return;
            store.addMessage(msg);
          }
          store.updateLastMessage(Number(msg.room), msg);
        } else if (data.type === "typing") {
          store.setTyping(roomId, data.user_id, data.display_name, data.is_typing);
        } else if (data.type === "read_receipt") {
          store.markMessageRead(data.message_id, data.user_id);
        } else if (data.type === "presence") {
          useContactsStore.getState().updateOnlineStatus(data.user_id, data.is_online);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = (e) => {
      setIsConnected(false);
      if (e.code === 1000 || e.code === 4001 || e.code === 4003) return;
      setTimeout(() => setRetryCount((n) => n + 1), 3000);
    };

    return () => {
      ws.close(1000);
      wsRef.current = null;
    };
  }, [roomId, accessToken, retryCount]);

  const sendMessage = useCallback((content: string): boolean => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "message", content }));
      return true;
    }
    return false;
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "typing", is_typing: isTyping }));
    }
  }, []);

  const sendReadReceipt = useCallback((messageId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "read_receipt", message_id: messageId })
      );
    }
  }, []);

  return { sendMessage, sendTyping, sendReadReceipt, isConnected };
}
