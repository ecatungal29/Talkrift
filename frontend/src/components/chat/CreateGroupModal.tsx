"use client";

import { useState, useEffect } from "react";
import { Users, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContactsStore } from "@/store/contactsStore";
import { createGroupRoom } from "@/api/chat";
import { getContacts } from "@/api/contacts";
import type { Room } from "@/store/chatStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (room: Room) => void;
}

export function CreateGroupModal({ isOpen, onClose, onCreated }: Props) {
  const contacts = useContactsStore((s) => s.contacts);
  const setContacts = useContactsStore((s) => s.setContacts);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch contacts when modal opens if not already loaded
  useEffect(() => {
    if (isOpen && contacts.length === 0) {
      getContacts().then(setContacts).catch(() => {});
    }
  }, [isOpen]);

  const toggle = (userId: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim() || selected.size < 1) return;
    setLoading(true);
    setError(null);
    try {
      const room = await createGroupRoom(name.trim(), Array.from(selected));
      onCreated(room);
      // Reset state
      setName("");
      setSelected(new Set());
      onClose();
    } catch {
      setError("Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setSelected(new Set());
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            New Group
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          {/* Group name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              Group name
            </label>
            <Input
              placeholder="e.g. Study Group, Team Alpha…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-accent border-0 focus-visible:ring-primary"
              autoFocus
            />
          </div>

          {/* Contact selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground font-medium">
              Add members{" "}
              {selected.size > 0 && (
                <span className="text-primary">({selected.size} selected)</span>
              )}
            </label>
            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto rounded-md border border-border bg-accent/30 p-1">
              {contacts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No contacts yet
                </p>
              ) : (
                contacts.map((contact) => {
                  const isSelected = selected.has(contact.user.id);
                  const initials = contact.user.display_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <button
                      key={contact.id}
                      onClick={() => toggle(contact.user.id)}
                      className={`flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors ${
                        isSelected
                          ? "bg-primary/15"
                          : "hover:bg-accent"
                      }`}
                    >
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={contact.user.avatar ?? undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {contact.user.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.user.email}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name.trim() || selected.size < 1 || loading}
            >
              {loading ? "Creating…" : "Create Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
