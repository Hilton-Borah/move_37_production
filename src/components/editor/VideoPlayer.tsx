'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useEffect, useRef } from 'react';

export default function VideoPlayer({ ref }: { ref: React.Ref<HTMLVideoElement> }) {
  const { timelineClips, currentTime, isPlaying } = useSelector((state: RootState) => state.editor);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Find the currently active clip
  const activeClip = timelineClips.find(clip => 
    currentTime >= clip.startTime && currentTime <= clip.endTime
  );

  // Handle video playback
  useEffect(() => {
    const video = typeof ref !== 'function' && ref?.current;
    if (!video || !activeClip) return;

    const clipOffset = currentTime - activeClip.startTime;
    video.currentTime = clipOffset;

    if (isPlaying) {
      video.play().catch(e => console.error('Playback failed:', e));
    } else {
      video.pause();
    }
  }, [currentTime, isPlaying, activeClip, ref]);

  if (!timelineClips.length || !activeClip) {
    return (
      <div className="relative bg-black rounded-lg flex items-center justify-center h-full min-h-[400px]">
        <div className="text-white text-lg">No video selected or available</div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={ref}
        src={activeClip.previewUrl}
        className="w-full max-h-[70vh]"
        controls={false}
        muted
      />
    </div>
  );
}