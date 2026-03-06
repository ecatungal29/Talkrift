"use client";

import { Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Room } from "@/store/chatStore";
import type { User } from "@/store/authStore";
import { useContactsStore } from "@/store/contactsStore";
import { useCallStore } from "@/store/callStore";

interface Props {
  room: Room;
  currentUser: User;
}

export function ChatHeader({ room, currentUser }: Props) {
  const contacts = useContactsStore((s) => s.contacts);
  const { startOutgoing, status: callStatus } = useCallStore();

  const other =
    room.room_type === "dm"
      ? room.participants.find((p) => p.id !== currentUser.id) ??
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

  const isOnline =
    room.room_type === "dm" && other
      ? contacts.find((c) => c.user.id === other.id)?.is_online ?? false
      : false;

  const handleCall = () => {
    if (other && callStatus === "idle") {
      startOutgoing(room.id, other);
    }
  };

  return (
    <div className="flex items-center gap-3 pl-14 md:pl-4 pr-4 py-3 border-b border-border bg-card flex-shrink-0">
      <div className="relative flex-shrink-0">
        <Avatar className="h-9 w-9">
          <AvatarImage src={other?.avatar ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
        {room.room_type === "dm" && (
          <span
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card ${
              isOnline ? "bg-green-500" : "bg-muted-foreground/40"
            }`}
          />
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm leading-tight">{displayName}</p>
        <p className="text-xs text-muted-foreground">
          {room.room_type === "group"
            ? `${room.participants.length} members`
            : isOnline
            ? "Online"
            : other?.email ?? ""}
        </p>
      </div>

      {room.room_type === "dm" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary flex-shrink-0"
              onClick={handleCall}
              disabled={callStatus !== "idle"}
            >
              <Phone className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Start call</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
