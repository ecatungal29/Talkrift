"use client";

import { useEffect, useRef } from "react";

interface Props {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}

export function VideoPlayer({ stream, muted = false, className = "" }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
}
