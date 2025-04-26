'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store/store';
import { useRef, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils/timeUtils';
import { moveClipInTimeline, setCurrentTime, togglePlay, addClipToTimeline } from '@/lib/store/editorSlice';
import { cn } from '@/lib/utils';

interface ClipItemProps {
  id: string;
  startTime: number;
  endTime: number;
  name: string;
  previewUrl: string;
  zoomLevel: number;
  isPlaying: boolean;
  onMove: (id: string, newStartTime: number) => void;
}

const ClipItem: React.FC<ClipItemProps> = ({ 
  id, startTime, endTime, name, previewUrl, zoomLevel, isPlaying, onMove 
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TIMELINE_CLIP',
    item: { id, startTime, type: 'TIMELINE_CLIP' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['TIMELINE_CLIP', 'LIBRARY_VIDEO'],
    drop: (item: any) => {
      if (item.id !== id) {
        if (item.type === 'LIBRARY_VIDEO') {
          // Add new clip from library
          const newStartTime = timelineClips.length > 0 
            ? timelineClips[timelineClips.length - 1].endTime
            : 0;
          
          dispatch(addClipToTimeline({
            id: item.id,
            name: item.name,
            previewUrl: item.previewUrl,
            startTime: newStartTime,
            endTime: newStartTime + item.duration,
            duration: item.duration,
          }));
        } else {
          // Move existing clip
          onMove(item.id, startTime);
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  const width = (endTime - startTime) * 100 * zoomLevel;

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={cn(
        "h-16 rounded flex items-center justify-between px-2 relative overflow-hidden",
        isPlaying ? "ring-2 ring-blue-500 bg-blue-100" : "bg-blue-500 text-white",
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
    audioTracks,
    currentTime,
    zoomLevel,
    isPlaying,
  } = useSelector((state: RootState) => state.editor);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Handle sequential playback
  useEffect(() => {
    if (!isPlaying) return;

    const activeClip = timelineClips.find(clip => 
      currentTime >= clip.startTime && currentTime <= clip.endTime
    );

    if (!activeClip && timelineClips.length > 0) {
      const nextClip = timelineClips.find(clip => clip.startTime > currentTime) || timelineClips[0];
      dispatch(setCurrentTime(nextClip.startTime));
    } else if (!activeClip) {
      dispatch(togglePlay());
    }
  }, [currentTime, isPlaying, timelineClips, dispatch]);

  const handleMoveClip = (id: string, newStartTime: number) => {
    dispatch(moveClipInTimeline({ id, newStartTime }));
  };

  // Main timeline drop zone for adding clips at the end
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
          <Button variant="outline" size="sm">Split</Button>
          <Button variant="outline" size="sm">Trim</Button>
        </div>
      </div>
      
      <div className="flex-1 bg-gray-200 rounded-lg p-2">
        <div 
          ref={timelineRef}
          className="relative h-32 bg-white rounded overflow-x-auto overflow-y-hidden"
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
                  onMove={handleMoveClip}
                />
              ))}
            </div>
          </div>
          
          {/* Audio tracks */}
          <div>
            <div className="text-xs font-medium mb-1">Audio Tracks</div>
            {audioTracks.map(track => (
              <div key={track.id} className="flex space-x-2 h-12 items-center mb-2">
                <div 
                  className="h-10 bg-green-500 rounded flex items-center px-2 text-white"
                  style={{ 
                    width: `${(track.endTime - track.startTime) * 100 * zoomLevel}px`, 
                    minWidth: `${(track.endTime - track.startTime) * 100 * zoomLevel}px` 
                  }}
                >
                  <span className="truncate text-sm">{track.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}