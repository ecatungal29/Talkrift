"use client";

import { useEffect, useCallback, useRef } from "react";
import { useContactsStore } from "@/store/contactsStore";
import * as contactsApi from "@/api/contacts";
import type { User } from "@/store/authStore";

export function useContacts() {
  const {
    contacts,
    incomingRequests,
    outgoingRequests,
    searchResults,
    isLoadingContacts,
    isLoadingRequests,
    isSearching,
    error,
    setContacts,
    setIncomingRequests,
    setOutgoingRequests,
    setSearchResults,
    setLoadingContacts,
    setLoadingRequests,
    setSearching,
    setError,
    removeContactById,
    removeIncomingRequest,
    updateSearchResultRelationship,
  } = useContactsStore();

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    setError(null);
    try {
      const data = await contactsApi.getContacts();
      setContacts(data);
    } catch {
      setError("Failed to load contacts.");
    } finally {
      setLoadingContacts(false);
    }
  }, [setContacts, setLoadingContacts, setError]);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const [incoming, outgoing] = await Promise.all([
        contactsApi.getIncomingRequests(),
        contactsApi.getOutgoingRequests(),
      ]);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
    } catch {
      // Non-fatal — contacts still show
    } finally {
      setLoadingRequests(false);
    }
  }, [setIncomingRequests, setOutgoingRequests, setLoadingRequests]);

  useEffect(() => {
    loadContacts();
    loadRequests();
  }, [loadContacts, loadRequests]);

  // ── Search ────────────────────────────────────────────────────────────────

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    (query: string) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (!query.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      searchTimerRef.current = setTimeout(async () => {
        try {
          const results = await contactsApi.searchUsers(query);
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [setSearchResults, setSearching]
  );

  const clearSearch = useCallback(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearchResults([]);
    setSearching(false);
  }, [setSearchResults, setSearching]);

  // ── Actions ───────────────────────────────────────────────────────────────

  async function sendRequest(toUserId: number) {
    updateSearchResultRelationship(toUserId, "pending_sent");
    try {
      await contactsApi.sendFriendRequest(toUserId);
      await loadRequests();
    } catch {
      updateSearchResultRelationship(toUserId, "none");
      setError("Could not send friend request.");
    }
  }

  async function acceptRequest(requestId: number, _fromUser: User) {
    removeIncomingRequest(requestId);
    try {
      await contactsApi.acceptFriendRequest(requestId);
      await loadContacts();
    } catch {
      setError("Could not accept request.");
      await loadRequests();
    }
  }

  async function rejectRequest(requestId: number) {
    removeIncomingRequest(requestId);
    try {
      await contactsApi.rejectFriendRequest(requestId);
    } catch {
      setError("Could not reject request.");
      await loadRequests();
    }
  }

  async function removeContact(contactId: number) {
    removeContactById(contactId);
    try {
      await contactsApi.removeContact(contactId);
    } catch {
      setError("Could not remove contact.");
      await loadContacts();
    }
  }

  return {
    contacts,
    incomingRequests,
    outgoingRequests,
    searchResults,
    isLoadingContacts,
    isLoadingRequests,
    isSearching,
    error,
    search,
    clearSearch,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeContact,
    reload: loadContacts,
  };
}
