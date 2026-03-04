import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Room } from "@/store/chatStore";
import type { User } from "@/store/authStore";

interface Props {
  room: Room;
  currentUser: User;
}

export function ChatHeader({ room, currentUser }: Props) {
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

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
      <Avatar className="h-9 w-9">
        <AvatarImage src={other?.avatar ?? undefined} />
        <AvatarFallback className="bg-primary/20 text-primary text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-semibold text-sm leading-tight">{displayName}</p>
        <p className="text-xs text-muted-foreground">
          {room.room_type === "group"
            ? `${room.participants.length} members`
            : other?.email ?? ""}
        </p>
      </div>
    </div>
  );
}
