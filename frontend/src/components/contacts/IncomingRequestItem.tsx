"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { FriendRequest } from "@/types/contacts";
import type { User } from "@/store/authStore";

interface IncomingRequestItemProps {
  request: FriendRequest;
  index: number;
  onAccept: (requestId: number, fromUser: User) => void;
  onReject: (requestId: number) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function IncomingRequestItem({
  request,
  index,
  onAccept,
  onReject,
}: IncomingRequestItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, overflow: "hidden" }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="flex items-center gap-3 px-3 py-2 rounded-md mx-1"
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage
          src={request.from_user.avatar}
          alt={request.from_user.display_name}
        />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">
          {getInitials(request.from_user.display_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{request.from_user.display_name}</p>
        <p className="text-xs text-muted-foreground">Wants to connect</p>
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <Button
          size="icon"
          className="h-7 w-7 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground"
          onClick={() => onAccept(request.id, request.from_user)}
        >
          <Check className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onReject(request.id)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
