import type { Contact, FriendRequest, UserSearchResult } from "@/types/contacts";

export const MOCK_CONTACTS: Contact[] = [
  {
    id: 1,
    user: { id: 2, display_name: "Alice Chen", email: "alice@example.com" },
    created_at: "2026-01-15T10:00:00Z",
    is_online: true,
  },
  {
    id: 2,
    user: { id: 3, display_name: "Bob Nakamura", email: "bob@example.com" },
    created_at: "2026-02-01T14:30:00Z",
    is_online: false,
  },
  {
    id: 3,
    user: { id: 4, display_name: "Clara Osei", email: "clara@example.com" },
    created_at: "2026-02-20T09:00:00Z",
    is_online: true,
  },
];

export const MOCK_INCOMING_REQUESTS: FriendRequest[] = [
  {
    id: 10,
    from_user: { id: 5, display_name: "Daniel Reyes", email: "daniel@example.com" },
    to_user: { id: 1, display_name: "You", email: "you@example.com" },
    status: "pending",
    created_at: "2026-03-01T08:00:00Z",
  },
];

export const MOCK_OUTGOING_REQUESTS: FriendRequest[] = [
  {
    id: 11,
    from_user: { id: 1, display_name: "You", email: "you@example.com" },
    to_user: { id: 6, display_name: "Erin Müller", email: "erin@example.com" },
    status: "pending",
    created_at: "2026-03-02T12:00:00Z",
  },
];

// Search results covering all 4 relationship states
export const MOCK_SEARCH_RESULTS: UserSearchResult[] = [
  { id: 7, display_name: "Aaron Kim", email: "aaron@example.com", relationship: "none" },
  { id: 5, display_name: "Daniel Reyes", email: "daniel@example.com", relationship: "pending_received" },
  { id: 6, display_name: "Erin Müller", email: "erin@example.com", relationship: "pending_sent" },
  { id: 2, display_name: "Alice Chen", email: "alice@example.com", relationship: "contact" },
  { id: 8, display_name: "Rodelyn Cardinas", email: "rodelyn@example.com", relationship: "none" },
];
