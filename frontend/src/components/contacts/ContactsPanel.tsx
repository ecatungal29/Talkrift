"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Users, Loader2 } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { useChatStore } from "@/store/chatStore";
import { createOrGetDmRoom } from "@/api/chat";
import { ContactItem } from "./ContactItem";
import { IncomingRequestItem } from "./IncomingRequestItem";
import { ContactSearchResult } from "./ContactSearchResult";

interface ContactsPanelProps {
  searchQuery: string;
}

export function ContactsPanel({ searchQuery }: ContactsPanelProps) {
  const router = useRouter();
  const { setRooms, rooms } = useChatStore();
  const {
    contacts,
    incomingRequests,
    searchResults,
    isLoadingContacts,
    isSearching,
    search,
    clearSearch,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeContact,
  } = useContacts();

  const handleMessage = useCallback(
    async (userId: number) => {
      const room = await createOrGetDmRoom(userId);
      // Add to rooms store if not already present
      if (!rooms.find((r) => r.id === room.id)) {
        setRooms([room, ...rooms]);
      }
      router.push(`/chat/${room.id}`);
    },
    [rooms, setRooms, router]
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      search(searchQuery);
    } else {
      clearSearch();
    }
  }, [searchQuery, search, clearSearch]);

  const isSearchMode = searchQuery.trim().length > 0;

  if (isLoadingContacts && !isSearchMode) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="py-1">
        <AnimatePresence mode="wait">
          {isSearchMode ? (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {isSearching && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isSearching && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8 px-4">
                  No users found for &ldquo;{searchQuery}&rdquo;
                </p>
              )}
              {!isSearching &&
                searchResults.map((result, i) => (
                  <ContactSearchResult
                    key={result.id}
                    result={result}
                    index={i}
                    onSendRequest={sendRequest}
                  />
                ))}
            </motion.div>
          ) : (
            <motion.div
              key="default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {/* Incoming requests */}
              {incomingRequests.length > 0 && (
                <>
                  <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Requests ({incomingRequests.length})
                  </p>
                  <AnimatePresence>
                    {incomingRequests.map((req, i) => (
                      <IncomingRequestItem
                        key={req.id}
                        request={req}
                        index={i}
                        onAccept={acceptRequest}
                        onReject={rejectRequest}
                      />
                    ))}
                  </AnimatePresence>
                  <Separator className="my-2" />
                </>
              )}

              {/* Contacts list */}
              <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contacts ({contacts.length})
              </p>
              {contacts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
                  <Users className="h-7 w-7 text-muted-foreground" />
                  <p className="text-sm font-medium">No contacts yet</p>
                  <p className="text-xs text-muted-foreground">
                    Search to find and add people
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {contacts.map((contact, i) => (
                    <ContactItem
                      key={contact.id}
                      contact={contact}
                      index={i}
                      onRemove={removeContact}
                      onMessage={handleMessage}
                    />
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
