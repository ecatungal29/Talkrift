"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getMessages, getRooms } from "@/api/chat";
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
    (content: string) => {
      if (!user) return;
      // Optimistic insert — shows message immediately before WS echo
      addMessage({
        id: -Date.now(), // negative temp ID, replaced when WS echoes back
        room: roomId,
        sender: user,
        content,
        message_type: "text",
        created_at: new Date().toISOString(),
      });
      sendMessage(content);
    },
    [user, roomId, addMessage, sendMessage]
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
