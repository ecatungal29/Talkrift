"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "@/store/chatStore";

interface Props {
  messages: Message[];
  currentUserId: number;
  isGroup: boolean;
  typingNames: string[];
  onLoadMore: () => void;
  hasMore: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  isGroup,
  typingNames,
  onLoadMore,
  hasMore,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);
  const isFirstLoad = useRef(true);
  // Track which message IDs have already been rendered so only truly new ones animate
  const seenIds = useRef<Set<number>>(new Set());

  // Scroll to bottom on first load and new messages from self
  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
      isFirstLoad.current = false;
      return;
    }
    const last = messages[messages.length - 1];
    if (last && last.sender.id === currentUserId) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, currentUserId]);

  // Preserve scroll position when prepending older messages
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isFirstLoad.current) return;
    const diff = el.scrollHeight - prevScrollHeight.current;
    if (diff > 0 && prevScrollHeight.current > 0) {
      el.scrollTop += diff;
    }
    prevScrollHeight.current = el.scrollHeight;
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !hasMore) return;
    if (el.scrollTop < 80) {
      prevScrollHeight.current = el.scrollHeight;
      onLoadMore();
    }
  }, [hasMore, onLoadMore]);

  // Find the last own message that has been seen by at least one other person
  const lastSeenOwnMsgId = messages
    .filter(
      (m) =>
        m.sender.id === currentUserId &&
        m.read_by_ids?.some((id) => id !== currentUserId)
    )
    .at(-1)?.id;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2 min-h-0"
    >
      {!hasMore && messages.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">
          Beginning of conversation
        </p>
      )}

      {messages.map((msg) => {
        const isNew = !seenIds.current.has(msg.id);
        seenIds.current.add(msg.id);
        return (
          <motion.div
            key={msg.id}
            initial={isNew ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <MessageBubble
              message={msg}
              isOwn={msg.sender.id === currentUserId}
              showSender={isGroup}
              isSeen={msg.id === lastSeenOwnMsgId}
            />
          </motion.div>
        );
      })}

      <AnimatePresence>
        {typingNames.length > 0 && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 pl-9"
          >
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-xs text-muted-foreground">
              {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing…
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}
