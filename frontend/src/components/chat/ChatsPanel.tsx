"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { getRooms } from "@/api/chat";

interface Props {
  searchQuery: string;
}

export function ChatsPanel({ searchQuery }: Props) {
  const router = useRouter();
  const { rooms, setRooms, activeRoomId } = useChatStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    getRooms().then(setRooms).catch(() => {});
  }, [setRooms]);

  const filtered = rooms.filter((room) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (room.room_type === "dm") {
      const other = room.participants.find((p) => p.id !== user?.id);
      return other?.display_name.toLowerCase().includes(q);
    }
    return room.name.toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 py-12 px-4 text-center">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          {rooms.length === 0 ? "No chats yet" : "No results"}
        </p>
        <p className="text-xs text-muted-foreground">
          {rooms.length === 0
            ? "Add contacts to start messaging"
            : "Try a different search"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {filtered.map((room) => {
        const other =
          room.room_type === "dm"
            ? room.participants.find((p) => p.id !== user?.id) ??
              room.participants[0]
            : null;

        const displayName =
          room.room_type === "dm"
            ? other?.display_name ?? "Unknown"
            : room.name || `Group (${room.participants.length})`;

        const initials = displayName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const lastMsg = room.last_message;
        const time = lastMsg
          ? new Date(lastMsg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        return (
          <button
            key={room.id}
            onClick={() => router.push(`/chat/${room.id}`)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-accent/50 transition-colors ${
              activeRoomId === room.id ? "bg-accent" : ""
            }`}
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={other?.avatar ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {time && (
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {time}
                  </span>
                )}
              </div>
              {lastMsg && (
                <p className="text-xs text-muted-foreground truncate">
                  {lastMsg.sender.id === user?.id ? "You: " : ""}
                  {lastMsg.content}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
