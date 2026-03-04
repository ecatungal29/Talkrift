"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getMessages, getRooms, createMessage } from "@/api/chat";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";

interface Props {
  params: Promise<{ roomId: string }>;
}

export default function ChatPage({ params }: Props) {
  const { roomId: roomIdStr } = use(params);
  const roomId = Number(roomIdStr);

  const {
    rooms,
    messages,
    typingUsers,
    setMessages,
    prependMessages,
    setActiveRoom,
    setRooms,
    addMessage,
    replaceMessage,
    updateLastMessage,
  } = useChatStore();
  const user = useAuthStore((s) => s.user);
  const { sendMessage, sendTyping } = useWebSocket(roomId);

  const room = rooms.find((r) => r.id === roomId);
  const roomMessages = messages[roomId] ?? [];
  const typingList = (typingUsers[roomId] ?? []).map((u) => u.display_name);

  const [nextCursor, setNextCursor] = useState<number | null | undefined>(
    undefined
  );
  const [loadingMore, setLoadingMore] = useState(false);

  // Load rooms if not already in store (e.g. direct URL navigation)
  useEffect(() => {
    if (rooms.length === 0) {
      getRooms().then(setRooms).catch(() => {});
    }
  }, []);

  // Load initial messages
  useEffect(() => {
    setActiveRoom(roomId);
    if (!messages[roomId]) {
      getMessages(roomId).then(({ messages: msgs, next_cursor }) => {
        setMessages(roomId, msgs);
        setNextCursor(next_cursor);
      });
    }
    return () => setActiveRoom(null);
  }, [roomId]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !nextCursor) return;
    setLoadingMore(true);
    try {
      const { messages: older, next_cursor } = await getMessages(
        roomId,
        nextCursor
      );
      prependMessages(roomId, older);
      setNextCursor(next_cursor);
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, nextCursor, loadingMore, prependMessages]);

  const handleSend = useCallback(
    async (content: string) => {
      if (!user) return;
      const tempId = -Date.now();
      // Optimistic insert — shows message immediately
      addMessage({
        id: tempId,
        room: roomId,
        sender: user,
        content,
        message_type: "text",
        created_at: new Date().toISOString(),
      });
      // Try WebSocket first; fall back to REST if not connected
      const sentViaWs = sendMessage(content);
      if (!sentViaWs) {
        try {
          const msg = await createMessage(roomId, content);
          replaceMessage(tempId, msg);
          updateLastMessage(roomId, msg);
        } catch {
          // Remove the failed optimistic message
          replaceMessage(tempId, {
            id: tempId,
            room: roomId,
            sender: user,
            content: `[failed] ${content}`,
            message_type: "text",
            created_at: new Date().toISOString(),
          });
        }
      }
    },
    [user, roomId, addMessage, sendMessage, replaceMessage, updateLastMessage]
  );

  if (!user) return null;

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0">
      <ChatHeader room={room} currentUser={user} />
      <MessageList
        messages={roomMessages}
        currentUserId={user.id}
        isGroup={room.room_type === "group"}
        typingNames={typingList}
        onLoadMore={handleLoadMore}
        hasMore={!!nextCursor}
      />
      <ChatInput onSend={handleSend} onTyping={sendTyping} />
    </div>
  );
}
