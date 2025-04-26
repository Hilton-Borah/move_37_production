import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Position = 'top' | 'middle' | 'bottom';
export type FontFamily = 'sans' | 'serif' | 'mono';

interface VideoClip {
  id: string;
  startTime: number;
  endTime: number;
  previewUrl: string;
  name: string;
  file?: File;
  duration: number;
  isActive?: boolean;
}

interface AudioTrack {
  id: string;
  startTime: number;
  endTime: number;
  muted: boolean;
  volume: number;
  name: string;
  url: string;
}

interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: Position;
  style: {
    fontFamily: FontFamily;
    fontSize: number;
    color: string;
    backgroundColor: string;
  };
}

interface ImageOverlay {
  id: string;
  url: string;
  startTime: number;
  endTime: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity: number;
  rotation: number;
}

interface EditorState {
  videoLibrary: VideoClip[];      // All uploaded videos
  timelineClips: VideoClip[];    // Videos currently in the timeline
  audioTracks: AudioTrack[];
  subtitles: Subtitle[];
  imageOverlays: ImageOverlay[];
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  selectedElement: string | null;
  volume: number;
  zoomLevel: number;
  activeVideoClipId: string | null;
}

const initialState: EditorState = {
  videoLibrary: [],
  timelineClips: [],
  audioTracks: [],
  subtitles: [],
  imageOverlays: [],
  currentTime: 0,
  isPlaying: false,
  duration: 0,
  selectedElement: null,
  volume: 80,
  zoomLevel: 1,
  activeVideoClipId: null,
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    // Video Library Actions
    addToVideoLibrary: (state, action: PayloadAction<VideoClip>) => {
      state.videoLibrary.push(action.payload);
    },
    removeFromVideoLibrary: (state, action: PayloadAction<string>) => {
      state.videoLibrary = state.videoLibrary.filter(clip => clip.id !== action.payload);
    },

    // Timeline Clip Actions
    addClipToTimeline: (state, action: PayloadAction<VideoClip>) => {
      state.timelineClips.push(action.payload);
      // Update total duration if this clip extends beyond current duration
      const clipEndTime = action.payload.startTime + action.payload.duration;
      if (clipEndTime > state.duration) {
        state.duration = clipEndTime;
      }
    },
    removeClipFromTimeline: (state, action: PayloadAction<string>) => {
      state.timelineClips = state.timelineClips.filter(clip => clip.id !== action.payload);
      // Recalculate duration
      state.duration = state.timelineClips.reduce((max, clip) => 
        Math.max(max, clip.startTime + clip.duration), 0);
    },
    moveClipInTimeline: (state, action: PayloadAction<{id: string; newStartTime: number}>) => {
      const clip = state.timelineClips.find(c => c.id === action.payload.id);
      if (clip) {
        clip.startTime = action.payload.newStartTime;
        clip.endTime = action.payload.newStartTime + clip.duration;
      }
    },
    updateTimelineClip: (state, action: PayloadAction<{id: string; startTime?: number; endTime?: number}>) => {
      const clip = state.timelineClips.find(c => c.id === action.payload.id);
      if (clip) {
        if (action.payload.startTime !== undefined) clip.startTime = action.payload.startTime;
        if (action.payload.endTime !== undefined) clip.duration = action.payload.endTime - clip.startTime;
      }
    },

    // Audio Track Actions
    addAudioTrack: (state, action: PayloadAction<AudioTrack>) => {
      state.audioTracks.push(action.payload);
    },
    updateAudioTrack: (state, action: PayloadAction<{id: string; volume?: number; muted?: boolean}>) => {
      if (action.payload.id === 'all') {
        state.audioTracks.forEach(track => {
          if (action.payload.volume !== undefined) track.volume = action.payload.volume;
          if (action.payload.muted !== undefined) track.muted = action.payload.muted;
        });
      } else {
        const track = state.audioTracks.find(t => t.id === action.payload.id);
        if (track) {
          if (action.payload.volume !== undefined) track.volume = action.payload.volume;
          if (action.payload.muted !== undefined) track.muted = action.payload.muted;
        }
      }
    },

    // Subtitle Actions
    addSubtitle: (state, action: PayloadAction<Subtitle>) => {
      state.subtitles.push(action.payload);
    },
    updateSubtitle: (state, action: PayloadAction<{id: string; text: string}>) => {
      const subtitle = state.subtitles.find(s => s.id === action.payload.id);
      if (subtitle) {
        subtitle.text = action.payload.text;
      }
    },

    // Image Overlay Actions
    addImageOverlay: (state, action: PayloadAction<ImageOverlay>) => {
      state.imageOverlays.push(action.payload);
    },
    updateImageOverlay: (state, action: PayloadAction<{id: string; position: {x: number; y: number}; size: {width: number; height: number}}>) => {
      const overlay = state.imageOverlays.find(i => i.id === action.payload.id);
      if (overlay) {
        overlay.position = action.payload.position;
        overlay.size = action.payload.size;
      }
    },

    // Playback Controls
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },

    // UI State
    selectElement: (state, action: PayloadAction<string | null>) => {
      state.selectedElement = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload;
    },
    setActiveVideoClip: (state, action: PayloadAction<string | null>) => {
      state.activeVideoClipId = action.payload;
    },

    // Deprecated (kept for backward compatibility)
    addVideoClip: (state, action: PayloadAction<VideoClip>) => {
      console.warn('addVideoClip is deprecated. Use addClipToTimeline instead.');
      state.timelineClips.push(action.payload);
      if (state.duration < action.payload.endTime) {
        state.duration = action.payload.endTime;
      }
    },
    removeVideoClip: (state, action: PayloadAction<string>) => {
      console.warn('removeVideoClip is deprecated. Use removeClipFromTimeline instead.');
      state.timelineClips = state.timelineClips.filter(clip => clip.id !== action.payload);
    },
    moveClip: (state, action: PayloadAction<{id: string; newStartTime: number}>) => {
      console.warn('moveClip is deprecated. Use moveClipInTimeline instead.');
      const clip = state.timelineClips.find(c => c.id === action.payload.id);
      if (clip) {
        const duration = clip.endTime - clip.startTime;
        clip.startTime = action.payload.newStartTime;
        clip.endTime = action.payload.newStartTime + duration;
      }
    },
    splitClip: (state, action: PayloadAction<{id: string; splitTime: number}>) => {
      const clipIndex = state.timelineClips.findIndex(c => c.id === action.payload.id);
      if (clipIndex >= 0) {
        const clip = state.timelineClips[clipIndex];
        const splitPosition = Math.max(
          clip.startTime + 0.1,
          Math.min(action.payload.splitTime, clip.endTime - 0.1)
        );
        
        const newClip = {
          ...clip,
          id: `${clip.id}-split-${Date.now()}`,
          startTime: splitPosition,
          endTime: clip.endTime,
          duration: clip.endTime - splitPosition
        };
        
        state.timelineClips[clipIndex] = {
          ...clip,
          endTime: splitPosition,
          duration: splitPosition - clip.startTime
        };
        
        state.timelineClips.splice(clipIndex + 1, 0, newClip);
      }
    },
    
    trimClip: (state, action: PayloadAction<{id: string; startTime?: number; endTime?: number}>) => {
      const clip = state.timelineClips.find(c => c.id === action.payload.id);
      if (clip) {
        if (action.payload.startTime !== undefined) {
          const newDuration = clip.endTime - action.payload.startTime;
          clip.startTime = action.payload.startTime;
          clip.duration = newDuration;
        }
        if (action.payload.endTime !== undefined) {
          clip.duration = action.payload.endTime - clip.startTime;
          clip.endTime = action.payload.endTime;
        }
      }
    },
    
    // Update duration calculation when clips change
    recalculateDuration: (state) => {
      if (state.timelineClips.length === 0) {
        state.duration = 0;
      } else {
        state.duration = Math.max(...state.timelineClips.map(clip => clip.endTime));
      }
    },
    updateTimelineClips: (state, action: PayloadAction<VideoClip[]>) => {
      state.timelineClips = action.payload;
    },
    
  },
});

export const {
  // Video Library
  addToVideoLibrary,
  removeFromVideoLibrary,
  splitClip,
trimClip,
recalculateDuration,
updateTimelineClips,
  addClipToTimeline,
  removeClipFromTimeline,
  moveClipInTimeline,
  updateTimelineClip,
  
  // Audio
  addAudioTrack,
  updateAudioTrack,
  
  // Subtitles
  addSubtitle,
  updateSubtitle,
  
  // Image Overlays
  addImageOverlay,
  updateImageOverlay,
  
  // Playback
  setCurrentTime,
  togglePlay,
  setDuration,
  
  // UI State
  selectElement,
  setVolume,
  setZoomLevel,
  setActiveVideoClip,
  
  // Deprecated (but exported for backward compatibility)
  addVideoClip,
  removeVideoClip,
  moveClip,
} = editorSlice.actions;

export default editorSlice.reducer;