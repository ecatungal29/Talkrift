import { create } from "zustand";
import type { Contact, FriendRequest, UserSearchResult } from "@/types/contacts";

interface ContactsState {
  contacts: Contact[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  searchResults: UserSearchResult[];
  isLoadingContacts: boolean;
  isLoadingRequests: boolean;
  isSearching: boolean;
  error: string | null;

  setContacts: (contacts: Contact[]) => void;
  setIncomingRequests: (requests: FriendRequest[]) => void;
  setOutgoingRequests: (requests: FriendRequest[]) => void;
  setSearchResults: (results: UserSearchResult[]) => void;
  setLoadingContacts: (loading: boolean) => void;
  setLoadingRequests: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setError: (error: string | null) => void;

  // Optimistic update actions
  removeContactById: (contactId: number) => void;
  removeIncomingRequest: (requestId: number) => void;
  removeOutgoingRequest: (requestId: number) => void;
  addContact: (contact: Contact) => void;
  updateSearchResultRelationship: (
    userId: number,
    relationship: UserSearchResult["relationship"]
  ) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  incomingRequests: [],
  outgoingRequests: [],
  searchResults: [],
  isLoadingContacts: false,
  isLoadingRequests: false,
  isSearching: false,
  error: null,

  setContacts: (contacts) => set({ contacts }),
  setIncomingRequests: (incomingRequests) => set({ incomingRequests }),
  setOutgoingRequests: (outgoingRequests) => set({ outgoingRequests }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setLoadingContacts: (isLoadingContacts) => set({ isLoadingContacts }),
  setLoadingRequests: (isLoadingRequests) => set({ isLoadingRequests }),
  setSearching: (isSearching) => set({ isSearching }),
  setError: (error) => set({ error }),

  removeContactById: (contactId) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== contactId),
    })),

  removeIncomingRequest: (requestId) =>
    set((state) => ({
      incomingRequests: state.incomingRequests.filter((r) => r.id !== requestId),
    })),

  removeOutgoingRequest: (requestId) =>
    set((state) => ({
      outgoingRequests: state.outgoingRequests.filter((r) => r.id !== requestId),
    })),

  addContact: (contact) =>
    set((state) => ({ contacts: [contact, ...state.contacts] })),

  updateSearchResultRelationship: (userId, relationship) =>
    set((state) => ({
      searchResults: state.searchResults.map((r) =>
        r.id === userId ? { ...r, relationship } : r
      ),
    })),
}));
