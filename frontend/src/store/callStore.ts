import { create } from "zustand";
import type { User } from "@/store/authStore";

export type CallStatus = "idle" | "calling" | "incoming" | "active";

type SignalSender = (type: string, toUser: number, data?: object) => void;

interface CallState {
  status: CallStatus;
  roomId: number | null;
  remoteUser: User | null;
  isCaller: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  _signalSender: SignalSender | null;

  setSignalSender: (fn: SignalSender | null) => void;
  startOutgoing: (roomId: number, remoteUser: User) => void;
  startIncoming: (roomId: number, remoteUser: User) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  setActive: () => void;
  endCall: () => void;
  setMuted: (v: boolean) => void;
  setCameraOff: (v: boolean) => void;
  setScreenSharing: (v: boolean) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  status: "idle",
  roomId: null,
  remoteUser: null,
  isCaller: false,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  _signalSender: null,

  setSignalSender: (fn) => set({ _signalSender: fn }),

  startOutgoing: (roomId, remoteUser) => {
    set({ status: "calling", roomId, remoteUser, isCaller: true });
    get()._signalSender?.("call_invite", remoteUser.id, { room_id: roomId });
  },

  startIncoming: (roomId, remoteUser) => {
    // Ignore new invite if already in a call
    if (get().status !== "idle") return;
    set({ status: "incoming", roomId, remoteUser, isCaller: false });
  },

  acceptCall: () => {
    const { remoteUser, roomId } = get();
    if (!remoteUser || !roomId) return;
    set({ status: "active" });
    get()._signalSender?.("call_accept", remoteUser.id, { room_id: roomId });
  },

  rejectCall: () => {
    const { remoteUser } = get();
    if (remoteUser) get()._signalSender?.("call_reject", remoteUser.id);
    set({ status: "idle", roomId: null, remoteUser: null, isCaller: false });
  },

  setActive: () => set({ status: "active" }),

  endCall: () => {
    const { remoteUser, status } = get();
    if (remoteUser && (status === "active" || status === "calling")) {
      get()._signalSender?.("call_end", remoteUser.id);
    }
    set({
      status: "idle",
      roomId: null,
      remoteUser: null,
      isCaller: false,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
    });
  },

  setMuted: (isMuted) => set({ isMuted }),
  setCameraOff: (isCameraOff) => set({ isCameraOff }),
  setScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
}));
