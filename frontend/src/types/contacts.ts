import type { User } from "@/store/authStore";

export interface Contact {
  id: number;
  user: User;
  created_at: string;
  is_online: boolean;
}

export interface FriendRequest {
  id: number;
  from_user: User;
  to_user: User;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface UserSearchResult {
  id: number;
  display_name: string;
  email: string;
  avatar?: string;
  // Describes what action the current user can take with this person
  relationship: "none" | "pending_sent" | "pending_received" | "contact";
}
