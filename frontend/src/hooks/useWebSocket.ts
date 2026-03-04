"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export function useWebSocket(roomId: number) {
  const wsRef = useRef<WebSocket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken || !roomId) return;

    const ws = new WebSocket(`${WS_BASE}/ws/chat/${roomId}/?token=${accessToken}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const store = useChatStore.getState();
        if (data.type === "message") {
          const msg: import("@/store/chatStore").Message = data.message;
          const currentUser = useAuthStore.getState().user;
          // If this is our own message, replace the optimistic entry instead of duplicating
          if (currentUser && msg.sender.id === currentUser.id) {
            const roomMsgs = store.messages[msg.room] ?? [];
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
            store.addMessage(msg);
          }
          store.updateLastMessage(msg.room, msg);
        } else if (data.type === "typing") {
          store.setTyping(roomId, data.user_id, data.display_name, data.is_typing);
        }
      } catch {
        // ignore parse errors
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomId, accessToken]);

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

  return { sendMessage, sendTyping, sendReadReceipt };
}
