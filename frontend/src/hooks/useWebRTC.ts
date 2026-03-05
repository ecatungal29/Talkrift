"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCallStore } from "@/store/callStore";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function useWebRTC(roomId: number, isCaller: boolean) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  // Queue ICE candidates that arrive before remote description is set
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const hasRemoteDesc = useRef(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;

    async function init() {
      // 1. Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      localStreamRef.current = stream;
      setLocalStream(stream);

      // 2. Create peer connection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      // 3. Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // 4. Wire remote stream
      const remote = new MediaStream();
      setRemoteStream(remote);
      pc.ontrack = (e) => {
        e.streams[0].getTracks().forEach((t) => remote.addTrack(t));
      };

      // 5. Connect signaling WS
      const ws = new WebSocket(
        `${WS_BASE}/ws/signal/${roomId}/?token=${accessToken}`
      );
      wsRef.current = ws;

      pc.onicecandidate = (e) => {
        if (e.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ice_candidate", data: e.candidate }));
        }
      };

      ws.onopen = async () => {
        if (!isCaller) return;
        // Caller creates and sends the offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", data: offer }));
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "offer" && !isCaller) {
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.data)
            );
            hasRemoteDesc.current = true;
            // Flush any queued ICE candidates
            for (const c of iceCandidateQueue.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            iceCandidateQueue.current = [];
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: "answer", data: answer }));
          } else if (data.type === "answer" && isCaller) {
            await pc.setRemoteDescription(
              new RTCSessionDescription(data.data)
            );
            hasRemoteDesc.current = true;
            for (const c of iceCandidateQueue.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            iceCandidateQueue.current = [];
          } else if (data.type === "ice_candidate") {
            const candidate = new RTCIceCandidate(data.data);
            if (hasRemoteDesc.current) {
              await pc.addIceCandidate(candidate);
            } else {
              iceCandidateQueue.current.push(data.data);
            }
          }
        } catch {
          // ignore
        }
      };
    }

    init().catch(console.error);

    return () => {
      cancelled = true;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      wsRef.current?.close(1000);
      pcRef.current = null;
      wsRef.current = null;
      localStreamRef.current = null;
      hasRemoteDesc.current = false;
      iceCandidateQueue.current = [];
    };
  }, [roomId, isCaller, accessToken]);

  // Sync mute state to audio tracks
  const isMuted = useCallStore((s) => s.isMuted);
  useEffect(() => {
    localStreamRef.current
      ?.getAudioTracks()
      .forEach((t) => (t.enabled = !isMuted));
  }, [isMuted]);

  // Sync camera state to video tracks
  const isCameraOff = useCallStore((s) => s.isCameraOff);
  useEffect(() => {
    localStreamRef.current
      ?.getVideoTracks()
      .forEach((t) => (t.enabled = !isCameraOff));
  }, [isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    const { isScreenSharing, setScreenSharing } = useCallStore.getState();
    const pc = pcRef.current;
    if (!pc) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(screenTrack);

        // Update local preview
        const audio = localStreamRef.current?.getAudioTracks() ?? [];
        const newStream = new MediaStream([screenTrack, ...audio]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);

        // Auto-revert when browser's native "Stop sharing" is clicked
        screenTrack.onended = () => toggleScreenShare();
        setScreenSharing(true);
      } catch {
        // user cancelled or denied
      }
    } else {
      // Revert to camera
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const cameraTrack = cameraStream.getVideoTracks()[0];
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        await sender?.replaceTrack(cameraTrack);

        const audio = localStreamRef.current?.getAudioTracks() ?? [];
        const newStream = new MediaStream([cameraTrack, ...audio]);
        localStreamRef.current = newStream;
        setLocalStream(newStream);
        setScreenSharing(false);
      } catch {
        // ignore
      }
    }
  }, []);

  return { localStream, remoteStream, toggleScreenShare };
}
