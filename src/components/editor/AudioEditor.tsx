'use client';

import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  addAudioTrack, 
  updateAudioTrack,
  removeAudioTrack,
  splitAudioTrack,
  trimAudioTrack,
  setActiveAudioTrack
} from '@/lib/store/editorSlice';
import { useDropzone } from 'react-dropzone';
import { useDrag, useDrop } from 'react-dnd';
import { Volume2, VolumeX, Music, Scissors, Trash2, Move } from 'lucide-react';
import { RootState } from '@/lib/store/store';
import WaveSurfer from 'wavesurfer.js';

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  startTime: number;
  endTime: number;
  volume: number;
  muted: boolean;
  fadeIn: number;
  fadeOut: number;
}

export default function AudioEditor() {
  const dispatch = useDispatch();
  const audioTracks = useSelector((state: RootState) => state.editor.audioTracks);
  const currentTime = useSelector((state: RootState) => state.editor.currentTime);
  const activeTrackId = useSelector((state: RootState) => state.editor.activeAudioTrackId);
  
  const [masterVolume, setMasterVolume] = useState(80);
  const [isMasterMuted, setIsMasterMuted] = useState(false);
  const [waveforms, setWaveforms] = useState<{[key: string]: WaveSurfer | null}>({});
  const waveformRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize waveforms for each track
  useEffect(() => {
    audioTracks.forEach(track => {
      if (!waveforms[track.id] && waveformRefs.current[track.id]) {
        const ws = WaveSurfer.create({
          container: waveformRefs.current[track.id]!,
          waveColor: '#3b82f6',
          progressColor: '#1d4ed8',
          cursorColor: '#1e40af',
          barWidth: 2,
          barRadius: 3,
          cursorWidth: 1,
          height: 60,
          barGap: 2,
          normalize: true,
          partialRender: true,
          interact: false
        });
        
        ws.load(track.url);
        setWaveforms(prev => ({ ...prev, [track.id]: ws }));
      }
    });

    return () => {
      Object.values(waveforms).forEach(ws => ws?.destroy());
    };
  }, [audioTracks]);

  // Handle drop of audio files
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.aac']
    },
    maxFiles: 5,
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        const name = file.name.replace(/\.[^/.]+$/, '');
        
        dispatch(addAudioTrack({
          id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          url,
          startTime: 0,
          endTime: 30, // Default 30 seconds
          volume: 80,
          muted: false,
          fadeIn: 0,
          fadeOut: 0
        }));
      });
    }
  });

  const handleMasterVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setMasterVolume(newVolume);
    setIsMasterMuted(newVolume === 0);
  };

  const toggleMasterMute = () => {
    const newMutedState = !isMasterMuted;
    setIsMasterMuted(newMutedState);
    setMasterVolume(newMutedState ? 0 : 80);
  };

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    dispatch(updateAudioTrack({
      id: trackId,
      volume,
      muted: volume === 0
    }));
  };

  const handleSplitTrack = (trackId: string) => {
    dispatch(splitAudioTrack({
      trackId,
      splitTime: currentTime,
      newTrackId: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
  };

  const handleTrimTrack = (trackId: string, type: 'start' | 'end') => {
    dispatch(trimAudioTrack({
      trackId,
      trimTime: currentTime,
      trimType: type
    }));
  };

  const handleDeleteTrack = (trackId: string) => {
    dispatch(removeAudioTrack(trackId));
    waveforms[trackId]?.destroy();
    setWaveforms(prev => {
      const newWaveforms = { ...prev };
      delete newWaveforms[trackId];
      return newWaveforms;
    });
  };

  const DraggableAudioTrack = ({ track }: { track: AudioTrack }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'AUDIO_TRACK',
      item: { id: track.id, type: 'AUDIO_TRACK' },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    const [, drop] = useDrop(() => ({
      accept: 'AUDIO_TRACK',
      hover: (item: { id: string }) => {
        if (item.id !== track.id) {
          // Handle reordering logic here
        }
      },
    }));

    return (
      <div
        ref={(node) => drag(drop(node))}
        className={`p-3 rounded-lg border ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} ${
          activeTrackId === track.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => dispatch(setActiveAudioTrack(track.id))}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Move className="text-gray-400 cursor-move" size={16} />
            <span className="text-sm font-medium truncate max-w-[120px]">{track.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-1"
              onClick={(e) => {
                e.stopPropagation();
                handleSplitTrack(track.id);
              }}
            >
              <Scissors size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-1"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTrack(track.id);
              }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
        
        <div ref={el => waveformRefs.current[track.id] = el} className="h-12" />
        
        <div className="flex items-center gap-2 mt-2">
          <Slider
            value={[track.volume]}
            onValueChange={(value) => handleTrackVolumeChange(track.id, value[0])}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-xs w-10 text-right">{track.volume}%</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="text-xs block mb-1">Fade In</label>
            <Slider
              value={[track.fadeIn]}
              onValueChange={(value) => dispatch(updateAudioTrack({
                id: track.id,
                fadeIn: value[0]
              }))}
              max={5}
              step={0.1}
            />
          </div>
          <div>
            <label className="text-xs block mb-1">Fade Out</label>
            <Slider
              value={[track.fadeOut]}
              onValueChange={(value) => dispatch(updateAudioTrack({
                id: track.id,
                fadeOut: value[0]
              }))}
              max={5}
              step={0.1}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Audio Tracks</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleMasterMute}
          >
            {isMasterMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          <Slider
            value={[masterVolume]}
            onValueChange={handleMasterVolumeChange}
            max={100}
            step={1}
            className="w-24"
          />
        </div>
      </div>
      
      <div 
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 mb-4 cursor-pointer ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-1 text-center">
          <Music className="h-6 w-6 text-gray-400" />
          <p className="text-sm">
            {isDragActive ? 'Drop audio files here' : 'Drag & drop audio files or click to browse'}
          </p>
          <p className="text-xs text-gray-500">Supports MP3, WAV, OGG, AAC</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {audioTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Music className="h-8 w-8 mb-2" />
            <p>No audio tracks added</p>
            <p className="text-sm">Add audio files to see them here</p>
          </div>
        ) : (
          audioTracks.map(track => (
            <DraggableAudioTrack key={track.id} track={track} />
          ))
        )}
      </div>
      
      {audioTracks.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const selectedTrack = audioTracks.find(t => t.id === activeTrackId);
                if (selectedTrack) {
                  handleTrimTrack(selectedTrack.id, 'start');
                }
              }}
              disabled={!activeTrackId}
            >
              Trim Start
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const selectedTrack = audioTracks.find(t => t.id === activeTrackId);
                if (selectedTrack) {
                  handleTrimTrack(selectedTrack.id, 'end');
                }
              }}
              disabled={!activeTrackId}
            >
              Trim End
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                const selectedTrack = audioTracks.find(t => t.id === activeTrackId);
                if (selectedTrack) {
                  handleSplitTrack(selectedTrack.id);
                }
              }}
              disabled={!activeTrackId}
            >
              Split
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}