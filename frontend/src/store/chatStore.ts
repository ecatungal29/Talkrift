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
  read_by_ids: number[];
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
  markMessageRead: (messageId: number, userId: number) => void;
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
    set((state) => {
      const rooms = state.rooms.map((r) =>
        r.id === roomId ? { ...r, last_message: message } : r
      );
      // Bubble the updated room to the top (most recent first)
      const idx = rooms.findIndex((r) => r.id === roomId);
      if (idx > 0) {
        const [room] = rooms.splice(idx, 1);
        rooms.unshift(room);
      }
      return { rooms };
    }),

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

  markMessageRead: (messageId, userId) =>
    set((state) => {
      let updatedMessages = state.messages;
      let updatedRooms = state.rooms;

      // Update in messages map
      for (const [roomId, msgs] of Object.entries(state.messages)) {
        const idx = msgs.findIndex((m) => m.id === messageId);
        if (idx >= 0) {
          const msg = msgs[idx];
          if (msg.read_by_ids.includes(userId)) break;
          const newMsg = { ...msg, read_by_ids: [...msg.read_by_ids, userId] };
          const newMsgs = [...msgs.slice(0, idx), newMsg, ...msgs.slice(idx + 1)];
          updatedMessages = { ...updatedMessages, [roomId]: newMsgs };
          // Also update last_message in the room if it matches
          updatedRooms = state.rooms.map((r) =>
            r.last_message?.id === messageId
              ? { ...r, last_message: newMsg }
              : r
          );
          break;
        }
      }

      return { messages: updatedMessages, rooms: updatedRooms };
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
