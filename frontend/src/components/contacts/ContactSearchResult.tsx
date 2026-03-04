"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Clock, UserCheck, Check } from "lucide-react";
import type { UserSearchResult } from "@/types/contacts";

interface ContactSearchResultProps {
  result: UserSearchResult;
  index: number;
  onSendRequest: (userId: number) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ContactSearchResult({
  result,
  index,
  onSendRequest,
}: ContactSearchResultProps) {
  const [sending, setSending] = useState(false);

  async function handleSend() {
    setSending(true);
    await onSendRequest(result.id);
    setSending(false);
  }

  function renderAction() {
    switch (result.relationship) {
      case "contact":
        return (
          <Badge variant="secondary" className="text-xs gap-1 flex-shrink-0">
            <UserCheck className="h-3 w-3" />
            Contact
          </Badge>
        );
      case "pending_sent":
        return (
          <Badge variant="outline" className="text-xs gap-1 flex-shrink-0">
            <Clock className="h-3 w-3" />
            Sent
          </Badge>
        );
      case "pending_received":
        return (
          <Badge
            variant="outline"
            className="text-xs gap-1 flex-shrink-0 border-primary/40 text-primary"
          >
            <Check className="h-3 w-3" />
            Incoming
          </Badge>
        );
      case "none":
      default:
        return (
          <Button
            size="icon"
            className="flex-shrink-0 h-7 w-7 bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground"
            disabled={sending}
            onClick={handleSend}
          >
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
        );
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.18 }}
      className="flex items-center gap-3 px-3 py-2 rounded-md mx-1 hover:bg-accent transition-colors"
    >
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={result.avatar} alt={result.display_name} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">
          {getInitials(result.display_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{result.display_name}</p>
        <p className="text-xs text-muted-foreground truncate">{result.email}</p>
      </div>

      {renderAction()}
    </motion.div>
  );
}
