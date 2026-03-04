import { create } from "zustand";
import type { User } from "@/store/authStore";

export interface Room {
  id: number;
  name: string;
  room_type: "dm" | "group";
  participants: User[];
  last_message: Message | null;
  created_at: string;
}

export interface Message {
  id: number;
  room: number;
  sender: User;
  content: string;
  message_type: "text" | "image" | "file";
  created_at: string;
}

interface TypingUser {
  user_id: number;
  display_name: string;
}

interface ChatState {
  rooms: Room[];
  activeRoomId: number | null;
  messages: Record<number, Message[]>;
  typingUsers: Record<number, TypingUser[]>;
  setRooms: (rooms: Room[]) => void;
  setActiveRoom: (id: number | null) => void;
  addMessage: (message: Message) => void;
  prependMessages: (roomId: number, messages: Message[]) => void;
  setMessages: (roomId: number, messages: Message[]) => void;
  updateLastMessage: (roomId: number, message: Message) => void;
  replaceMessage: (tempId: number, message: Message) => void;
  setTyping: (roomId: number, userId: number, displayName: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  activeRoomId: null,
  messages: {},
  typingUsers: {},

  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (id) => set({ activeRoomId: id }),

  addMessage: (message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [message.room]: [
          ...(state.messages[message.room] ?? []),
          message,
        ],
      },
    })),

  prependMessages: (roomId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...messages, ...(state.messages[roomId] ?? [])],
      },
    })),

  setMessages: (roomId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [roomId]: messages },
    })),

  updateLastMessage: (roomId, message) =>
    set((state) => ({
      rooms: state.rooms.map((r) =>
        r.id === roomId ? { ...r, last_message: message } : r
      ),
    })),

  replaceMessage: (tempId, message) =>
    set((state) => {
      const roomMsgs = state.messages[message.room] ?? [];
      const idx = roomMsgs.findIndex((m) => m.id === tempId);
      const updated =
        idx >= 0
          ? [...roomMsgs.slice(0, idx), message, ...roomMsgs.slice(idx + 1)]
          : [...roomMsgs, message];
      return { messages: { ...state.messages, [message.room]: updated } };
    }),

  setTyping: (roomId, userId, displayName, isTyping) =>
    set((state) => {
      const current = state.typingUsers[roomId] ?? [];
      const filtered = current.filter((u) => u.user_id !== userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: isTyping
            ? [...filtered, { user_id: userId, display_name: displayName }]
            : filtered,
        },
      };
    }),
}));
