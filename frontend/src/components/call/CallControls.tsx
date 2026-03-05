"use client";

import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCallStore } from "@/store/callStore";

interface Props {
  onToggleScreenShare: () => void;
  onHangUp: () => void;
}

export function CallControls({ onToggleScreenShare, onHangUp }: Props) {
  const isMuted = useCallStore((s) => s.isMuted);
  const isCameraOff = useCallStore((s) => s.isCameraOff);
  const isScreenSharing = useCallStore((s) => s.isScreenSharing);
  const setMuted = useCallStore((s) => s.setMuted);
  const setCameraOff = useCallStore((s) => s.setCameraOff);

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isCameraOff ? "destructive" : "secondary"}
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setCameraOff(!isCameraOff)}
          >
            {isCameraOff ? (
              <VideoOff className="h-4 w-4" />
            ) : (
              <Video className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isCameraOff ? "Turn camera on" : "Turn camera off"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isScreenSharing ? "default" : "secondary"}
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={onToggleScreenShare}
          >
            <Monitor className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isScreenSharing ? "Stop sharing" : "Share screen"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={onHangUp}
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Hang up</TooltipContent>
      </Tooltip>
    </div>
  );
}
