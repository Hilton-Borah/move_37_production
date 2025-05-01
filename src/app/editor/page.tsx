'use client'; 

import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store/store';
import { useEffect, useRef, useState } from 'react';
import VideoUpload from '@/components/editor/VideoUpload';
import Timeline from '@/components/editor/Timeline';
import SubtitleEditor from '@/components/editor/SubtitleEditor';
import ImageOverlay from '@/components/editor/ImageOverlay';
import PreviewControls from '@/components/editor/PreviewControls';
import VideoPlayer from '@/components/editor/VideoPlayer';
import {setCurrentTime, setZoomLevel } from '@/lib/store/editorSlice';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import AudioEditor from '@/components/editor/AudioEditor';

export default function EditorPage() {
  const dispatch = useDispatch<AppDispatch>();
  const {  isPlaying, zoomLevel } = useSelector((state: RootState) => state.editor);
  const [activeTab, setActiveTab] = useState('video');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const mainVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = mainVideoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      dispatch(setCurrentTime(video.currentTime));
    };

    const handleLoadedMetadata = () => {
      // dispatch(setDuration(video.duration));
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

  const handleSidebarToggle = (isVisible: boolean) => {
    setSidebarVisible(isVisible);
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
              min={0}
              max={2}
              step={0.1}
              className="w-32"
            />
            <span className="text-sm w-8">{zoomLevel.toFixed(1)}x</span>
          </div>
          <Button
        variant="default"
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white"
        onClick={() => alert('Export functionality would be implemented here')}
      >
        Export
      </Button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - conditionally rendered based on sidebarVisible */}
        {sidebarVisible && (
            <div className="w-64 min-w-[16rem] bg-gray-200 p-4 overflow-y-auto border-r border-gray-300 flex-shrink-0">
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
            {activeTab === 'audio' && <AudioEditor />}
            {activeTab === 'text' && <SubtitleEditor />}
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0"> {/* Added min-w-0 to prevent overflow */}
        <div className="flex-1 p-4 overflow-auto min-h-0"> {/* Added min-h-0 */}
            <VideoPlayer 
              ref={mainVideoRef} 
              onSidebarToggle={handleSidebarToggle}
            />
          </div>
          
          <div className="h-48 border-t border-gray-300 bg-white flex-shrink-0">
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