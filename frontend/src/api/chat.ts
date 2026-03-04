import apiClient from "@/api/client";
import type { Room, Message } from "@/store/chatStore";

export async function getRooms(): Promise<Room[]> {
  const { data } = await apiClient.get<Room[]>("/chat/rooms/");
  return data;
}

export interface MessagesPage {
  messages: Message[];
  next_cursor: number | null;
}

export async function getMessages(
  roomId: number,
  cursor?: number
): Promise<MessagesPage> {
  const params: Record<string, string | number> = { limit: 50 };
  if (cursor) params.cursor = cursor;
  const { data } = await apiClient.get<MessagesPage>(
    `/chat/rooms/${roomId}/messages/`,
    { params }
  );
  return data;
}

export async function createOrGetDmRoom(otherUserId: number): Promise<Room> {
  const { data } = await apiClient.post<Room>("/chat/rooms/", {
    room_type: "dm",
    participant_ids: [otherUserId],
  });
  return data;
}

export async function createMessage(
  roomId: number,
  content: string
): Promise<Message> {
  const { data } = await apiClient.post<Message>(
    `/chat/rooms/${roomId}/messages/`,
    { content, message_type: "text" }
  );
  return data;
}
