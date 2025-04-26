'use client'; 


import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store/store';
import { useEffect, useRef, useState } from 'react';
import VideoUpload from '@/components/editor/VideoUpload';
import Timeline from '@/components/editor/Timeline';
import AudioControls from '@/components/editor/AudioControls';
import SubtitleEditor from '@/components/editor/SubtitleEditor';
import ImageOverlay from '@/components/editor/ImageOverlay';
import PreviewControls from '@/components/editor/PreviewControls';
import VideoPlayer from '@/components/editor/VideoPlayer';
import { setDuration, setCurrentTime, togglePlay, setZoomLevel } from '@/lib/store/editorSlice';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function EditorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentTime, isPlaying, duration, zoomLevel } = useSelector((state: RootState) => state.editor);
  const [activeTab, setActiveTab] = useState('video');
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      dispatch(setCurrentTime(video.currentTime));
    };

    const handleLoadedMetadata = () => {
      dispatch(setDuration(video.duration));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [dispatch]);

  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(e => console.error('Playback failed:', e));
    } else {
      video.pause();
    }
  }, [isPlaying]);

  const handleZoomChange = (value: number[]) => {
    dispatch(setZoomLevel(value[0]));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Video Editor</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm">Zoom:</span>
            <Slider
              value={[zoomLevel]}
              onValueChange={handleZoomChange}
              min={0.5}
              max={2}
              step={0.1}
              className="w-32"
            />
            <span className="text-sm w-8">{zoomLevel.toFixed(1)}x</span>
          </div>
          <Button variant="outline" size="sm">Export</Button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-64 bg-gray-200 p-4 overflow-y-auto border-r border-gray-300">
          <div className="flex border-b border-gray-300 mb-4">
            <Button
              variant={activeTab === 'video' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('video')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Video
            </Button>
            <Button
              variant={activeTab === 'audio' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('audio')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Audio
            </Button>
            <Button
              variant={activeTab === 'text' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('text')}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              Text
            </Button>
          </div>
          
          {activeTab === 'video' && (
            <>
              <VideoUpload />
              <ImageOverlay />
            </>
          )}
          {activeTab === 'audio' && <AudioControls />}
          {activeTab === 'text' && <SubtitleEditor />}
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4 overflow-auto">
            <VideoPlayer ref={mainVideoRef} />
          </div>
          
          <div className="h-48 border-t border-gray-300 bg-white">
            <Timeline />
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-800 text-white p-2">
        <PreviewControls />
      </footer>
    </div>
  );
}