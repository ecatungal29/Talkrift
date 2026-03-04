"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserMinus, MessageSquare } from "lucide-react";
import type { Contact } from "@/types/contacts";

interface ContactItemProps {
  contact: Contact;
  index: number;
  onRemove: (contactId: number) => void;
  onMessage?: (userId: number) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ContactItem({ contact, index, onRemove, onMessage }: ContactItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="flex items-center gap-3 px-3 py-2 rounded-md mx-1 cursor-pointer hover:bg-accent transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={contact.user.avatar} alt={contact.user.display_name} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {getInitials(contact.user.display_name)}
          </AvatarFallback>
        </Avatar>
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-sidebar ${
            contact.is_online ? "bg-green-500" : "bg-muted-foreground/40"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{contact.user.display_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {contact.is_online ? "Online" : contact.user.email}
        </p>
      </div>

      {hovered && (
        <div className="flex items-center gap-0.5">
          {onMessage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage(contact.user.id);
                  }}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Message</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(contact.id);
                }}
              >
                <UserMinus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove contact</TooltipContent>
          </Tooltip>
        </div>
      )}
    </motion.div>
  );
}
