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
import { debounce } from 'lodash'; 

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
}

const ClipItem: React.FC<ClipItemProps> = ({ 
  id, startTime, endTime, name, previewUrl, zoomLevel, isPlaying, isSelected, onMove 
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
    accept: ['TIMELINE_CLIP', 'LIBRARY_VIDEO'],
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
      if (item.id !== id) {
        if (item.type === 'LIBRARY_VIDEO') {
          // ... existing library drop logic ...
        }
      }
    }
  }));

  const width = (endTime - startTime) * 100 * zoomLevel;

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cn(
        "h-16 rounded flex items-center justify-between px-2 relative overflow-hidden",
        isPlaying ? "ring-2 ring-blue-500 bg-blue-100" : "bg-blue-500 text-white",
        isSelected ? "ring-2 ring-yellow-500" : "",
        isDragging ? "opacity-50" : "opacity-100",
        isOver ? "bg-blue-600" : ""
      )}
      style={{ width: `${width}px`, minWidth: `${width}px` }}
    >
      {isPlaying && (
        <video
          src={previewUrl}
          className="absolute inset-0 object-cover w-full h-full opacity-20"
          autoPlay
          muted
        />
      )}
      <span className="truncate text-sm z-10">{name}</span>
      <span className="text-xs z-10">
        {formatTime(startTime)}-{formatTime(endTime)}
      </span>
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

  
  const updateCurrentTime = useRef(
    debounce((time: number) => {
      dispatch(setCurrentTime(time));
    }, 50)
  ).current;
  
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
      
      // updateCurrentTime(newTime);
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
    
    const clip = timelineClips.find(c => c.id === selectedClipId);
    if (!clip) return;
    
    // Ensure split happens within clip bounds
    const safeSplitTime = Math.max(
      clip.startTime + 0.1, // Minimum 0.1s from start
      Math.min(splitPosition, clip.endTime - 0.1) // Minimum 0.1s from end
    );
    
    dispatch(splitClip({ 
      id: selectedClipId, 
      splitTime: safeSplitTime 
    }));
    setSelectedClipId(null);
    setSplitPosition(null);
  };

  const handleTrimClip = (type: 'start' | 'end') => {
    if (!selectedClipId) return;
    
    const clipIndex = timelineClips.findIndex(c => c.id === selectedClipId);
    if (clipIndex === -1) return;
    
    const clip = timelineClips[clipIndex];
    
    if (type === 'start') {
      // Don't allow trimming past other clips
      const minStart = clipIndex > 0 ? 
        timelineClips[clipIndex - 1].endTime : 0;
      const newStart = Math.max(minStart, currentTime);
      
      dispatch(trimClip({ 
        id: selectedClipId, 
        startTime: newStart 
      }));
    } else {
      // Don't allow trimming before other clips
      const maxEnd = clipIndex < timelineClips.length - 1 ? 
        timelineClips[clipIndex + 1].startTime : duration;
      const newEnd = Math.min(maxEnd, currentTime);
      
      dispatch(trimClip({ 
        id: selectedClipId, 
        endTime: newEnd 
      }));
    }
    
    dispatch(recalculateDuration());
  };

  const handleDeleteClip = (id: string) => {
    const clipIndex = timelineClips.findIndex(c => c.id === id);
    if (clipIndex === -1) return;
    
    const clip = timelineClips[clipIndex];
    const clipDuration = clip.endTime - clip.startTime;
    
    dispatch(removeClipFromTimeline(id));
    
    // Shift subsequent clips to fill the gap
    if (clipIndex < timelineClips.length - 1) {
      const updatedClips = [...timelineClips];
      updatedClips.splice(clipIndex, 1);
      
      for (let i = clipIndex; i < updatedClips.length; i++) {
        updatedClips[i] = {
          ...updatedClips[i],
          startTime: updatedClips[i].startTime - clipDuration,
          endTime: updatedClips[i].endTime - clipDuration
        };
      }
      
      // You'll need to implement a bulk update action in your slice
      dispatch(updateTimelineClips(updatedClips));
    }
    
    dispatch(recalculateDuration());
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