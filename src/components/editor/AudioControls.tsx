'use client';

import { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { addAudioTrack, updateAudioTrack } from '@/lib/store/editorSlice';
import { useDropzone } from 'react-dropzone';
import { Volume2, VolumeX, Music } from 'lucide-react';

export default function AudioControls() {
  const dispatch = useDispatch();
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setAudioFile(file);
        setAudioName(file.name.replace(/\.[^/.]+$/, ''));
        const previewUrl = URL.createObjectURL(file);
        
        dispatch(addAudioTrack({
          id: `audio-${Date.now()}`,
          startTime: 0,
          endTime: 60, // Default 1 minute
          muted: false,
          volume: 80,
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: previewUrl
        }));
      }
    }
  });

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    
    // Update all audio tracks in Redux
    dispatch(updateAudioTrack({
      id: 'all', // Special ID to update all tracks
      volume: newVolume,
      muted: newVolume === 0
    }));
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audioRef.current) {
      audioRef.current.volume = newMutedState ? 0 : volume / 100;
    }
    
    dispatch(updateAudioTrack({
      id: 'all',
      volume: newMutedState ? 0 : volume,
      muted: newMutedState
    }));
  };

  const handleAddSampleMusic = () => {
    dispatch(addAudioTrack({
      id: `sample-${Date.now()}`,
      startTime: 0,
      endTime: 120, // 2 minutes
      muted: false,
      volume: 80,
      name: 'Sample Music',
      url: '/sample-music.mp3' // Make sure this file exists in public folder
    }));
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Audio Controls</h2>
      
      <div className="space-y-4">
        {/* Main Volume Control */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-medium">Master Volume</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleMute}
              className="p-1 h-6 w-6"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
          <Slider 
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={100} 
            step={1} 
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>{isMuted ? 'Muted' : `${volume}%`}</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Music Upload */}
        <div>
          <h3 className="text-sm font-medium mb-1">Background Music</h3>
          <div 
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer mb-2 ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-1">
              <Music className="h-5 w-5 text-gray-400" />
              {isDragActive ? (
                <p className="text-sm">Drop audio file here</p>
              ) : (
                <p className="text-sm">Drag & drop music file or click to select</p>
              )}
              <p className="text-xs text-gray-500">MP3, WAV, OGG supported</p>
            </div>
          </div>
          
          {audioFile && (
            <div className="mt-2">
              <Input
                value={audioName}
                onChange={(e) => setAudioName(e.target.value)}
                placeholder="Music track name"
              />
            </div>
          )}
          
          <div className="flex gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={handleAddSampleMusic}
            >
              Add Sample
            </Button>
          </div>
        </div>
        
        {/* Audio Visualization */}
        <div className="h-20 bg-gray-100 rounded p-2 flex items-center justify-center">
          {audioFile ? (
            <div className="w-full">
              <div className="h-12 bg-gray-200 rounded-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-400 animate-pulse" style={{ 
                  width: '100%',
                  background: 'linear-gradient(90deg, rgba(96,165,250,0.2) 0%, rgba(96,165,250,0.6) 50%, rgba(96,165,250,0.2) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'wave 2s linear infinite'
                }} />
              </div>
              <audio ref={audioRef} src={URL.createObjectURL(audioFile)} hidden />
            </div>
          ) : (
            <p className="text-xs text-gray-500">Audio waveform will appear here</p>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes wave {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}