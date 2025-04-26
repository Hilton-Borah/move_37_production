'use client';

import React, { forwardRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';

interface VideoPlayerProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  ref: React.Ref<HTMLVideoElement>;
  onSidebarToggle?: (isVisible: boolean) => void;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(({ onSidebarToggle, ...props }, ref) => {
  const { timelineClips = [], subtitles = [], imageOverlays = [], currentTime, isPlaying } = useSelector((state: RootState) => state.editor);
  const [videoSize, setVideoSize] = useState<'auto' | 'fixed'>('auto');
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape'>('landscape');
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Find the currently active clip based on currentTime
  // const activeClip = timelineClips.find(clip => 
  //   currentTime >= clip.startTime && currentTime <= clip.startTime + (clip.duration || clip.endTime)
  // );

  const activeClip = timelineClips.find(clip => 
    currentTime >= clip.startTime && currentTime < clip.endTime
  );

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    const newState = !showSidebar;
    setShowSidebar(newState);
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };

  // Sync video playback with Redux state
  useEffect(() => {
    const video = typeof ref !== 'function' && ref?.current;
    if (!video || !activeClip) return;

    // Calculate the offset within the current clip
    const clipOffset = currentTime - activeClip.startTime;
    
    // Only update if the difference is significant to avoid flickering
    if (Math.abs(video.currentTime - clipOffset) > 0.1) {
      video.currentTime = clipOffset;
    }

    if (isPlaying) {
      video.play().catch(e => console.error('Playback failed:', e));
    } else {
      video.pause();
    }
  }, [currentTime, isPlaying, activeClip, ref]);

  // If no clips or no active clip, show placeholder
  if (!timelineClips.length || !activeClip) {
    return (
      <div className="relative bg-black rounded-lg flex items-center justify-center h-full min-h-[400px]">
        <div className="text-white text-lg">Upload or add a video to begin editing</div>
      </div>
    );
  }

  // Calculate video dimensions based on selected options
  const getVideoDimensions = () => {
    if (videoSize === 'auto') {
      return {
        width: '100%',
        height: 'auto',
        maxHeight: '70vh'
      };
    }
    
    return {
      width: aspectRatio === 'portrait' ? 'auto' : '100%',
      height: aspectRatio === 'portrait' ? '100%' : 'auto',
      maxWidth: '100%',
      maxHeight: '70vh'
    };
  };

  const videoStyle = getVideoDimensions();



  return (
    <div className={`relative bg-black rounded-lg overflow-hidden flex flex-col h-full ${!showSidebar ? 'w-full' : ''}`}>
      {/* Video Controls Bar */}
      <div className="flex items-center justify-start p-2 bg-gray-800 text-white">
        <div className="flex space-x-2">
          <button 
            onClick={() => setVideoSize(videoSize === 'auto' ? 'fixed' : 'auto')}
            className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            {videoSize === 'auto' ? 'Fixed Size' : 'Auto Size'}
          </button>
          
          {videoSize === 'fixed' && (
            <>
              <button 
                onClick={() => setAspectRatio('landscape')}
                className={`px-3 py-1 rounded hover:bg-gray-600 ${aspectRatio === 'landscape' ? 'bg-blue-500' : 'bg-gray-700'}`}
              >
                Landscape
              </button>
              <button 
                onClick={() => setAspectRatio('portrait')}
                className={`px-3 py-1 rounded hover:bg-gray-600 ${aspectRatio === 'portrait' ? 'bg-blue-500' : 'bg-gray-700'}`}
              >
                Portrait
              </button>
            </>
          )}
        </div>
        <button 
          onClick={toggleSidebar}
          className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600"
        >
          {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
        </button>
      </div>
      
      {/* Video Container */}
      <div className="flex-grow flex items-center justify-center overflow-hidden">
      <video
  ref={ref}
  src={activeClip?.previewUrl || ''}
  className={`w-full ${videoSize === 'fixed' ? 'object-contain' : ''}`}
  style={videoStyle}
  controls={false}
  {...props}
/>
      </div>
      
      {/* Subtitles */}
      {subtitles.filter(subtitle => 
        currentTime >= subtitle.startTime && currentTime <= subtitle.endTime
      ).map(subtitle => (
        <div
          key={subtitle.id}
          className={`absolute left-0 right-0 text-center text-white p-2 ${
            subtitle.position === 'top' ? 'top-4' : 
            subtitle.position === 'middle' ? 'top-1/2 transform -translate-y-1/2' : 
            'bottom-20'
          }`}
          style={{
            fontFamily: subtitle.style.fontFamily === 'sans' ? 'sans-serif' : 
                       subtitle.style.fontFamily === 'serif' ? 'serif' : 'monospace',
            fontSize: `${subtitle.style.fontSize}px`,
            color: subtitle.style.color,
            backgroundColor: subtitle.style.backgroundColor,
          }}
        >
          {subtitle.text}
        </div>
      ))}
      
      {/* Image Overlays */}
      {imageOverlays.filter(overlay => 
        currentTime >= overlay.startTime && currentTime <= overlay.endTime
      ).map(overlay => (
        <div
          key={overlay.id}
          className="absolute"
          style={{
            left: `${overlay.position.x}%`,
            top: `${overlay.position.y}%`,
            width: `${overlay.size.width}px`,
            height: `${overlay.size.height}px`,
            opacity: overlay.opacity,
            transform: `rotate(${overlay.rotation}deg)`,
          }}
        >
          <img
            src={overlay.url}
            alt="Overlay"
            className="w-full h-full object-contain"
          />
        </div>
      ))}
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;