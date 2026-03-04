import apiClient from "@/api/client";
import type {
	Contact,
	FriendRequest,
	UserSearchResult,
} from "@/types/contacts";
import {
	MOCK_CONTACTS,
	MOCK_INCOMING_REQUESTS,
	MOCK_OUTGOING_REQUESTS,
	MOCK_SEARCH_RESULTS,
} from "@/lib/mocks/contacts";

// ── Swap flag ─────────────────────────────────────────────────────────────────
// Set to false when the backend is ready. No other file needs to change.
const USE_MOCK = false;
// ─────────────────────────────────────────────────────────────────────────────

function mockDelay<T>(data: T, ms = 400): Promise<T> {
	return new Promise((res) => setTimeout(() => res(data), ms));
}

export async function getContacts(): Promise<Contact[]> {
	if (USE_MOCK) return mockDelay([...MOCK_CONTACTS]);
	const { data } = await apiClient.get<Contact[]>("/contacts/");
	return data;
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
	if (USE_MOCK) {
		if (!query.trim()) return mockDelay([]);
		const q = query.toLowerCase();
		return mockDelay(
			MOCK_SEARCH_RESULTS.filter(
				(u) =>
					u.display_name.toLowerCase().includes(q) ||
					u.email.toLowerCase().includes(q),
			),
		);
	}
	const { data } = await apiClient.get<UserSearchResult[]>(
		"/contacts/search/",
		{
			params: { q: query },
		},
	);
	return data;
}

export async function getIncomingRequests(): Promise<FriendRequest[]> {
	if (USE_MOCK) return mockDelay([...MOCK_INCOMING_REQUESTS]);
	const { data } = await apiClient.get<FriendRequest[]>(
		"/contacts/requests/incoming/",
	);
	return data;
}

export async function getOutgoingRequests(): Promise<FriendRequest[]> {
	if (USE_MOCK) return mockDelay([...MOCK_OUTGOING_REQUESTS]);
	const { data } = await apiClient.get<FriendRequest[]>(
		"/contacts/requests/outgoing/",
	);
	return data;
}

export async function sendFriendRequest(
	toUserId: number,
): Promise<FriendRequest> {
	if (USE_MOCK) {
		const newReq: FriendRequest = {
			id: Date.now(),
			from_user: { id: 1, display_name: "You", email: "you@example.com" },
			to_user: { id: toUserId, display_name: "User", email: "" },
			status: "pending",
			created_at: new Date().toISOString(),
		};
		return mockDelay(newReq);
	}
	const { data } = await apiClient.post<FriendRequest>("/contacts/requests/", {
		to_user_id: toUserId,
	});
	return data;
}

export async function acceptFriendRequest(requestId: number): Promise<void> {
	if (USE_MOCK) return mockDelay(undefined);
	await apiClient.post(`/contacts/requests/${requestId}/accept/`);
}

export async function rejectFriendRequest(requestId: number): Promise<void> {
	if (USE_MOCK) return mockDelay(undefined);
	await apiClient.post(`/contacts/requests/${requestId}/reject/`);
}

export async function removeContact(contactId: number): Promise<void> {
	if (USE_MOCK) return mockDelay(undefined);
	await apiClient.delete(`/contacts/${contactId}/`);
}
