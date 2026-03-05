"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, PhoneMissed } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/store/callStore";
import { useWebRTC } from "@/hooks/useWebRTC";
import { VideoPlayer } from "./VideoPlayer";
import { CallControls } from "./CallControls";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── Outgoing call view ─────────────────────────────────────────────────────

function OutgoingView() {
  const remoteUser = useCallStore((s) => s.remoteUser);
  const endCall = useCallStore((s) => s.endCall);

  return (
    <div className="flex flex-col items-center gap-4 p-6 w-72">
      <div className="relative">
        <Avatar className="h-20 w-20">
          <AvatarImage src={remoteUser?.avatar ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-xl">
            {getInitials(remoteUser?.display_name ?? "?")}
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
      </div>
      <div className="text-center">
        <p className="font-semibold">{remoteUser?.display_name}</p>
        <p className="text-sm text-muted-foreground">Calling…</p>
      </div>
      <Button
        variant="destructive"
        size="icon"
        className="h-12 w-12 rounded-full"
        onClick={endCall}
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}

// ── Incoming call view ─────────────────────────────────────────────────────

function IncomingView() {
  const remoteUser = useCallStore((s) => s.remoteUser);
  const acceptCall = useCallStore((s) => s.acceptCall);
  const rejectCall = useCallStore((s) => s.rejectCall);

  return (
    <div className="flex flex-col items-center gap-4 p-6 w-72">
      <Avatar className="h-20 w-20">
        <AvatarImage src={remoteUser?.avatar ?? undefined} />
        <AvatarFallback className="bg-primary/20 text-primary text-xl">
          {getInitials(remoteUser?.display_name ?? "?")}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <p className="font-semibold">{remoteUser?.display_name}</p>
        <p className="text-sm text-muted-foreground">Incoming call…</p>
      </div>
      <div className="flex gap-6">
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={rejectCall}
          >
            <PhoneMissed className="h-5 w-5" />
          </Button>
          <span className="text-xs text-muted-foreground">Decline</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700"
            onClick={acceptCall}
          >
            <Phone className="h-5 w-5" />
          </Button>
          <span className="text-xs text-muted-foreground">Accept</span>
        </div>
      </div>
    </div>
  );
}

// ── Active call view ───────────────────────────────────────────────────────

function ActiveView() {
  const roomId = useCallStore((s) => s.roomId);
  const isCaller = useCallStore((s) => s.isCaller);
  const remoteUser = useCallStore((s) => s.remoteUser);
  const endCall = useCallStore((s) => s.endCall);

  const { localStream, remoteStream, toggleScreenShare } = useWebRTC(
    roomId!,
    isCaller
  );

  return (
    <div className="flex flex-col w-80">
      {/* Remote video — main */}
      <div className="relative bg-black rounded-t-xl overflow-hidden h-48">
        <VideoPlayer
          stream={remoteStream}
          className="w-full h-full object-cover"
        />
        {/* Local video PiP */}
        <div className="absolute bottom-2 right-2 w-20 h-16 rounded-lg overflow-hidden border border-border shadow-lg bg-black">
          <VideoPlayer
            stream={localStream}
            muted
            className="w-full h-full object-cover"
          />
        </div>
        {/* Remote user name */}
        <div className="absolute top-2 left-2">
          <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full">
            {remoteUser?.display_name}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-card rounded-b-xl border-t border-border">
        <CallControls
          onToggleScreenShare={toggleScreenShare}
          onHangUp={endCall}
        />
      </div>
    </div>
  );
}

// ── Root modal ─────────────────────────────────────────────────────────────

export function CallModal() {
  const status = useCallStore((s) => s.status);

  return (
    <AnimatePresence>
      {status !== "idle" && (
        <motion.div
          key="call-modal"
          initial={{ opacity: 0, scale: 0.9, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
        >
          {status === "calling" && <OutgoingView />}
          {status === "incoming" && <IncomingView />}
          {status === "active" && <ActiveView />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
