'use client';

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store/store';
import { togglePlay, setCurrentTime } from '@/lib/store/editorSlice';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { formatTime } from '@/lib/utils/timeUtils';

export default function PreviewControls() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentTime, duration, isPlaying } = useSelector((state: RootState) => state.editor);

  const handlePlayPause = () => {
    dispatch(togglePlay());
  };

  const handleTimeChange = (value: number[]) => {
    dispatch(setCurrentTime(value[0]));
  };

  const jumpBackward = () => {
    const newTime = Math.max(0, currentTime - 5);
    dispatch(setCurrentTime(newTime));
  };

  const jumpForward = () => {
    const newTime = Math.min(duration, currentTime + 5);
    dispatch(setCurrentTime(newTime));
  };

  return (
    <div className="flex items-center justify-between w-full px-4 py-2 bg-gray-100 rounded-lg">
      {/* Time Display and Progress Bar */}
      <div className="flex-1 flex items-center gap-4">
        <span className="text-sm font-mono w-16 text-right">
          {formatTime(currentTime)}
        </span>
        
        <Slider
          value={[currentTime]}
          onValueChange={handleTimeChange}
          min={0}
          max={duration || 100}
          step={0.1}
          className="flex-1"
        />
        
        <span className="text-sm font-mono w-16">
          {formatTime(duration)}
        </span>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2 mx-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={jumpBackward}
          title="Jump back 5 seconds"
          className="rounded-full"
        >
          <SkipBack className="h-4 w-4" />
          <span className="sr-only">Jump back 5 seconds</span>
        </Button>

        <Button
          variant="default"
          size="lg"
          onClick={handlePlayPause}
          className="rounded-full w-12 h-12 p-0"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-0.5" /> // Slight adjustment for play icon
          )}
          <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={jumpForward}
          title="Jump forward 5 seconds"
          className="rounded-full"
        >
          <SkipForward className="h-4 w-4" />
          <span className="sr-only">Jump forward 5 seconds</span>
        </Button>
      </div>

      {/* Export Button */}
      <Button
        variant="default"
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={() => alert('Export functionality would be implemented here')}
      >
        Export Video
      </Button>
    </div>
  );
}