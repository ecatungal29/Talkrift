import { create } from "zustand";

export interface Room {
  id: number;
  name: string;
  is_group: boolean;
  participants: number[];
  last_message?: {
    content: string;
    created_at: string;
    sender_id: number;
  };
  unread_count?: number;
}

export interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read_by: number[];
}

interface ChatState {
  rooms: Room[];
  activeRoomId: number | null;
  messages: Record<number, Message[]>;
  setRooms: (rooms: Room[]) => void;
  setActiveRoom: (id: number | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (roomId: number, messages: Message[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  activeRoomId: null,
  messages: {},
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (id) => set({ activeRoomId: id }),
  addMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.room_id]: [
          ...(state.messages[message.room_id] ?? []),
          message,
        ],
      },
    })),
  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [roomId]: messages },
    })),
}));
