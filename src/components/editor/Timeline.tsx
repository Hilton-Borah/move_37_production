'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store/store';
import { useRef, useEffect, useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils/timeUtils';
import { 
  moveClipInTimeline, 
  setCurrentTime, 
  togglePlay, 
  addClipToTimeline, 
  removeClipFromTimeline, 
  recalculateDuration, 
  trimClip, 
  splitClip, 
  updateTimelineClips
} from '@/lib/store/editorSlice';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface ClipItemProps {
  id: string;
  startTime: number;
  endTime: number;
  name: string;
  previewUrl: string;
  zoomLevel: number;
  isPlaying: boolean;
  isSelected: boolean;
  onMove: (id: string, newStartTime: number) => void;
  type: 'video' | 'image';
  overlayData?: {
    position: { x: number; y: number };
    size: { width: number; height: number };
    opacity: number;
    rotation: number;
  };
  duration: number;
}

const ClipItem: React.FC<ClipItemProps> = ({ 
  id, startTime, endTime, name, previewUrl, type, zoomLevel, isPlaying, isSelected, onMove 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const timelineClips = useSelector((state: RootState) => state.editor.timelineClips);

  const [, drag] = useDrag(() => ({
    type: 'TIMELINE_CLIP',
    item: { id, startTime, type: 'TIMELINE_CLIP' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      if (!monitor.didDrop()) {
        // Return to original position if not dropped on a valid target
        onMove(id, startTime);
      }
    }
  }));

const [, drop] = useDrop(() => ({
    accept: ['TIMELINE_CLIP', 'LIBRARY_VIDEO','IMAGE_OVERLAY'],
    hover: (item: any, monitor) => {
      if (item.type !== 'TIMELINE_CLIP') return;
      
      const dragIndex = timelineClips.findIndex(c => c.id === item.id);
      const hoverIndex = timelineClips.findIndex(c => c.id === id);
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      if (!hoverBoundingRect) return;
      
      // Get vertical middle
      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      
      // Get mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // Get pixels to the left
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      
      // Only perform the move when the mouse has crossed half of the items width
      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;
      
      // Time to actually perform the action
      onMove(item.id, startTime);
    },
    drop: (item: any) => {
      if (item.type === 'LIBRARY_VIDEO') {
        // Existing video handling
      } else if (item.type === 'IMAGE_OVERLAY') {
        const newStartTime = timelineClips.length > 0 
          ? timelineClips[timelineClips.length - 1].endTime
          : 0;
        
        dispatch(addClipToTimeline({
          id: `img-${Date.now()}`,
          name: item.name,
          previewUrl: item.previewUrl,
          type: 'image',
          startTime: newStartTime,
          endTime: newStartTime + item.duration,
          duration: item.duration,
          position: item.position,
          size: item.size,
          opacity: item.opacity,
          rotation: item.rotation
        }));
      }
    },
  }));

  const width = (endTime - startTime) * 100 * zoomLevel;

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cn(
        "h-16 rounded flex items-center justify-between px-2 relative overflow-hidden",
        isPlaying ? "ring-2 ring-blue-500 bg-blue-100" : "bg-blue-500 text-white",
        isSelected ? "ring-2 ring-yellow-500" : "",
        // isDragging ? "opacity-50" : "opacity-100",
        // isOver ? "bg-blue-600" : ""
      )}
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
       {type === 'image' ? (
        <img 
          src={previewUrl} 
          alt="Image overlay" 
          className="absolute inset-0 object-cover w-full h-full opacity-70"
        />
      ) : (
        isPlaying && (
          <video
            src={previewUrl}
            className="absolute inset-0 object-cover w-full h-full opacity-20"
            autoPlay
            muted
          />
        )
      )}
      <span className="truncate text-sm z-10">{name}</span>
      <span className="text-xs z-10">
        {formatTime(startTime)}-{formatTime(endTime)}
      </span>
      {type === 'image' && (
        <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 rounded-full p-1">
          <ImageIcon className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
};

export default function Timeline() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    timelineClips,
    currentTime,
    zoomLevel,
    isPlaying,
    duration
  } = useSelector((state: RootState) => state.editor);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [splitPosition, setSplitPosition] = useState<number | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);


  
  const [, drop] = useDrop(() => ({
    accept: 'LIBRARY_VIDEO',
    drop: (item: any) => {
      const newStartTime = timelineClips.length > 0 
        ? timelineClips[timelineClips.length - 1].endTime
        : 0;
      
      dispatch(addClipToTimeline({
        id: item.id,
        name: item.name,
        previewUrl: item.previewUrl,
        startTime: newStartTime,
        duration: item.duration,
        endTime: newStartTime + item.duration,
      }));
    },
  }));

  // Handle playback of all clips sequentially
  useEffect(() => {
    if (!isPlaying) return;
    
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const frame = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000; // Convert to seconds
      lastTime = now;
      
      const newTime = currentTime + delta;
      
      if (newTime >= duration) {
        dispatch(togglePlay());
        dispatch(setCurrentTime(0));
        return;
      }
      
      dispatch(setCurrentTime(newTime));
      animationFrameId = requestAnimationFrame(frame);
    };
    
    animationFrameId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, currentTime, duration, dispatch]);

  const handleMoveClip = (id: string, newStartTime: number) => {
    dispatch(moveClipInTimeline({ id, newStartTime }));
    dispatch(recalculateDuration());
  };

  const handleSplitClip = () => {
    if (!selectedClipId || splitPosition === null) return;
    
    const clipIndex = timelineClips.findIndex(c => c.id === selectedClipId);
    if (clipIndex === -1) return;
    
    const clip = timelineClips[clipIndex];
    const safeSplitTime = Math.max(
      clip.startTime + 0.1,
      Math.min(splitPosition, clip.endTime - 0.1)
    );
    
    // Pause playback during split
    if (isPlaying) dispatch(togglePlay());
    
    dispatch(splitClip({ 
      id: selectedClipId,
      splitTime: safeSplitTime,
      // Generate new ID for the second part
      newClipId: `${selectedClipId}-split-${Date.now()}`
    }));
    
    // Adjust current time if we split the currently playing clip
    if (currentTime >= safeSplitTime) {
      dispatch(setCurrentTime(safeSplitTime));
    }
    
    setSelectedClipId(null);
    setSplitPosition(null);
  };

  const handleTrimClip = (type: 'start' | 'end') => {
    if (!selectedClipId) return;
    
    const clipIndex = timelineClips.findIndex(c => c.id === selectedClipId);
    if (clipIndex === -1) return;
    
    const clip = timelineClips[clipIndex];
    let newTime = currentTime;
    
    if (type === 'start') {
      const minStart = clipIndex > 0 ? 
        timelineClips[clipIndex - 1].endTime : 0;
      newTime = Math.max(minStart, currentTime);
      
      // If trimming the currently playing clip, adjust playback
      if (isPlaying && currentTime < newTime) {
        dispatch(setCurrentTime(newTime));
      }
      
      dispatch(trimClip({
        id: selectedClipId,
        startTime: newTime,
        duration: clip.endTime - newTime
      }));
    } else {
      const maxEnd = clipIndex < timelineClips.length - 1 ? 
        timelineClips[clipIndex + 1].startTime : duration;
      newTime = Math.min(maxEnd, currentTime);
      
      // If trimming the currently playing clip, adjust playback
      if (isPlaying && currentTime > newTime) {
        dispatch(setCurrentTime(newTime));
        dispatch(togglePlay()); // Pause if we trimmed past current time
      }
      
      dispatch(trimClip({
        id: selectedClipId,
        endTime: newTime,
        duration: newTime - clip.startTime
      }));
    }
    
    dispatch(recalculateDuration());
  };


  const handleDeleteClip = (id: string) => {
    const clipIndex = timelineClips.findIndex(c => c.id === id);
    if (clipIndex === -1) return;
    
    const clip = timelineClips[clipIndex];
    const isPlayingDeletedClip = isPlaying && 
      currentTime >= clip.startTime && 
      currentTime <= clip.endTime;
    
    // Pause playback if deleting the currently playing clip
    if (isPlayingDeletedClip) {
      dispatch(togglePlay());
    }
    
    dispatch(removeClipFromTimeline(id));
    
    // Shift subsequent clips to fill the gap
    const updatedClips = timelineClips.filter(c => c.id !== id);
    const durationRemoved = clip.endTime - clip.startTime;
    
    for (let i = clipIndex; i < updatedClips.length; i++) {
      updatedClips[i] = {
        ...updatedClips[i],
        startTime: updatedClips[i].startTime - durationRemoved,
        endTime: updatedClips[i].endTime - durationRemoved
      };
    }
    
    dispatch(updateTimelineClips(updatedClips));
    dispatch(recalculateDuration());
    
    // Adjust current time if it was within the deleted clip
    if (isPlayingDeletedClip) {
      const newTime = clipIndex > 0 ? 
        updatedClips[clipIndex - 1].endTime : 0;
      dispatch(setCurrentTime(newTime));
    }
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedTime = clickX / (100 * zoomLevel);
    
    // Find if we clicked on a clip
    const clickedClip = timelineClips.find(clip => 
      clickedTime >= clip.startTime && clickedTime <= clip.endTime
    );
    
    if (clickedClip) {
      setSelectedClipId(clickedClip.id);
      setSplitPosition(clickedTime);
    } else {
      setSelectedClipId(null);
      setSplitPosition(null);
    }
  };

  return (
    <div className="h-full flex flex-col" ref={drop}>
      <div className="flex justify-between items-center mb-2 px-2">
        <h2 className="text-lg font-semibold">Timeline</h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => dispatch(togglePlay())}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSplitClip}
            disabled={!selectedClipId}
          >
            Split
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleTrimClip('start')}
            disabled={!selectedClipId}
          >
            Trim Start
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleTrimClip('end')}
            disabled={!selectedClipId}
          >
            Trim End
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => selectedClipId && handleDeleteClip(selectedClipId)}
            disabled={!selectedClipId}
          >
            Delete
          </Button>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-200 rounded-lg p-2">
        <div 
          ref={timelineRef}
          className="relative h-32 bg-white rounded overflow-x-auto overflow-y-hidden"
          onClick={handleTimelineClick}
        >
          {/* Current time indicator */}
          <div 
            className="absolute h-full w-0.5 bg-red-500 z-10" 
            style={{ left: `${currentTime * 100 * zoomLevel}px` }}
          >
            <div className="absolute -top-2 -left-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          
          {/* Video track */}
          <div className="mb-4">
            <div className="text-xs font-medium mb-1">Video Track</div>
            <div className="flex space-x-2 h-16">
              {timelineClips.map(clip => (
                <ClipItem 
                  key={clip.id}
                  id={clip.id}
                  startTime={clip.startTime}
                  endTime={clip.endTime}
                  name={clip.name}
                  previewUrl={clip.previewUrl}
                  zoomLevel={zoomLevel}
                  isPlaying={isPlaying && currentTime >= clip.startTime && currentTime <= clip.endTime}
                  isSelected={selectedClipId === clip.id}
                  onMove={handleMoveClip}
                />
              ))}
            </div>
          </div>
          
          {/* Split position indicator */}
          {splitPosition !== null && (
            <div 
              className="absolute h-full w-0.5 bg-yellow-500 z-10" 
              style={{ left: `${splitPosition * 100 * zoomLevel}px` }}
            >
              <div className="absolute -top-2 -left-1.5 w-3 h-3 bg-yellow-500 rounded-full"></div>
            </div>
          )}
        </div>
        
        {/* Timeline duration info */}
        <div className="text-right text-sm mt-2">
          Total Duration: {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}