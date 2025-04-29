import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface SubtitleStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
}

interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: "top" | "middle" | "bottom";
  style: SubtitleStyle;
}

interface ImageOverlay {
  id: string;
  url: string;
  startTime: number;
  endTime: number;
  position: Position;
  size: Size;
  opacity: number;
  rotation: number;
}

interface TimelineClip {
  id: string;
  name: string;
  previewUrl: string;
  type: "video" | "image" | "audio";
  startTime: number;
  endTime: number;
  duration: number;
  position?: Position;
  size?: Size;
  opacity?: number;
  rotation?: number;
  volume?: number;
  muted?: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

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

interface VideoLibraryItem {
  id: string;
  name: string;
  previewUrl: string;
  duration: number;
  filePath?: string; // Optional if you're storing file paths
}
interface EditorState {
  timelineClips: TimelineClip[];
  audioTracks: AudioTrack[];
  subtitles: Subtitle[];
  imageOverlays: ImageOverlay[];
  currentTime: number;
  duration: number;
  zoomLevel: number;
  isPlaying: boolean;
  activeAudioTrackId: string | null;
  videoLibrary: VideoLibraryItem[];
}

const initialState: EditorState = {
  timelineClips: [],
  audioTracks: [],
  subtitles: [],
  imageOverlays: [],
  currentTime: 0,
  duration: 0,
  zoomLevel: 1,
  isPlaying: false,
  activeAudioTrackId: null,
  videoLibrary: [],
};

export const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    // Timeline and Video Controls
    setCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    setZoomLevel: (state, action: PayloadAction<number>) => {
      state.zoomLevel = action.payload;
    },
    recalculateDuration: (state) => {
      if (state.timelineClips.length === 0) {
        state.duration = 0;
        return;
      }
      state.duration = Math.max(
        ...state.timelineClips.map((clip) => clip.endTime)
      );
    },

    // Timeline Clip Actions
    addClipToTimeline: (state, action: PayloadAction<TimelineClip>) => {
      state.timelineClips.push(action.payload);
      state.duration = Math.max(state.duration, action.payload.endTime);
    },
    removeClipFromTimeline: (state, action: PayloadAction<string>) => {
      state.timelineClips = state.timelineClips.filter(
        (clip) => clip.id !== action.payload
      );
    },
    moveClipInTimeline: (
      state,
      action: PayloadAction<{ id: string; newStartTime: number }>
    ) => {
      const clip = state.timelineClips.find((c) => c.id === action.payload.id);
      if (clip) {
        const duration = clip.endTime - clip.startTime;
        clip.startTime = action.payload.newStartTime;
        clip.endTime = action.payload.newStartTime + duration;
      }
    },
    trimClip: (
      state,
      action: PayloadAction<{
        id: string;
        startTime?: number;
        endTime?: number;
        duration?: number;
      }>
    ) => {
      const clip = state.timelineClips.find((c) => c.id === action.payload.id);
      if (clip) {
        if (action.payload.startTime !== undefined) {
          clip.startTime = action.payload.startTime;
          if (action.payload.duration !== undefined) {
            clip.endTime = clip.startTime + action.payload.duration;
          }
        }
        if (action.payload.endTime !== undefined) {
          clip.endTime = action.payload.endTime;
          if (action.payload.duration !== undefined) {
            clip.startTime = clip.endTime - action.payload.duration;
          }
        }
      }
    },
    splitClip: (
      state,
      action: PayloadAction<{
        id: string;
        splitTime: number;
        newClipId: string;
      }>
    ) => {
      const clipIndex = state.timelineClips.findIndex(
        (c) => c.id === action.payload.id
      );
      if (clipIndex >= 0) {
        const clip = state.timelineClips[clipIndex];
        if (
          action.payload.splitTime > clip.startTime &&
          action.payload.splitTime < clip.endTime
        ) {
          const newClip: TimelineClip = {
            ...clip,
            id: action.payload.newClipId,
            startTime: action.payload.splitTime,
            endTime: clip.endTime,
            duration: clip.endTime - action.payload.splitTime,
          };
          state.timelineClips[clipIndex].endTime = action.payload.splitTime;
          state.timelineClips[clipIndex].duration =
            action.payload.splitTime - clip.startTime;
          state.timelineClips.splice(clipIndex + 1, 0, newClip);
        }
      }
    },
    updateTimelineClips: (state, action: PayloadAction<TimelineClip[]>) => {
      state.timelineClips = action.payload;
    },

    // Image Overlay Actions
    addImageOverlay: (state, action: PayloadAction<ImageOverlay>) => {
      state.imageOverlays.push(action.payload);
    },
    removeImageOverlay: (state, action: PayloadAction<string>) => {
      state.imageOverlays = state.imageOverlays.filter(
        (overlay) => overlay.id !== action.payload
      );
    },
    updateImageOverlay: (
      state,
      action: PayloadAction<{
        id: string;
        position?: Position;
        size?: Size;
        opacity?: number;
        rotation?: number;
      }>
    ) => {
      const overlay = state.imageOverlays.find(
        (o) => o.id === action.payload.id
      );
      if (overlay) {
        if (action.payload.position) overlay.position = action.payload.position;
        if (action.payload.size) overlay.size = action.payload.size;
        if (action.payload.opacity) overlay.opacity = action.payload.opacity;
        if (action.payload.rotation) overlay.rotation = action.payload.rotation;
      }
    },

    // Audio Track Actions
    addAudioTrack: (state, action: PayloadAction<AudioTrack>) => {
      state.audioTracks.push(action.payload);
      state.activeAudioTrackId = action.payload.id;
    },
    updateAudioTrack: (
      state,
      action: PayloadAction<{
        id: string;
        volume?: number;
        muted?: boolean;
        fadeIn?: number;
        fadeOut?: number;
      }>
    ) => {
      if (action.payload.id === "all") {
        state.audioTracks.forEach((track) => {
          if (action.payload.volume !== undefined)
            track.volume = action.payload.volume;
          if (action.payload.muted !== undefined)
            track.muted = action.payload.muted;
        });
      } else {
        const track = state.audioTracks.find((t) => t.id === action.payload.id);
        if (track) {
          if (action.payload.volume !== undefined)
            track.volume = action.payload.volume;
          if (action.payload.muted !== undefined)
            track.muted = action.payload.muted;
          if (action.payload.fadeIn !== undefined)
            track.fadeIn = action.payload.fadeIn;
          if (action.payload.fadeOut !== undefined)
            track.fadeOut = action.payload.fadeOut;
        }
      }
    },
    removeAudioTrack: (state, action: PayloadAction<string>) => {
      state.audioTracks = state.audioTracks.filter(
        (t) => t.id !== action.payload
      );
      if (state.activeAudioTrackId === action.payload) {
        state.activeAudioTrackId = null;
      }
    },
    splitAudioTrack: (
      state,
      action: PayloadAction<{
        trackId: string;
        splitTime: number;
        newTrackId: string;
      }>
    ) => {
      const trackIndex = state.audioTracks.findIndex(
        (t) => t.id === action.payload.trackId
      );
      if (trackIndex >= 0) {
        const track = state.audioTracks[trackIndex];
        if (
          action.payload.splitTime > track.startTime &&
          action.payload.splitTime < track.endTime
        ) {
          const newTrack: AudioTrack = {
            ...track,
            id: action.payload.newTrackId,
            startTime: action.payload.splitTime,
            endTime: track.endTime,
          };
          state.audioTracks[trackIndex].endTime = action.payload.splitTime;
          state.audioTracks.splice(trackIndex + 1, 0, newTrack);
        }
      }
    },
    trimAudioTrack: (
      state,
      action: PayloadAction<{
        trackId: string;
        trimTime: number;
        trimType: "start" | "end";
      }>
    ) => {
      const track = state.audioTracks.find(
        (t) => t.id === action.payload.trackId
      );
      if (track) {
        if (action.payload.trimType === "start") {
          track.startTime = Math.min(
            action.payload.trimTime,
            track.endTime - 0.1
          );
        } else {
          track.endTime = Math.max(
            action.payload.trimTime,
            track.startTime + 0.1
          );
        }
      }
    },
    setActiveAudioTrack: (state, action: PayloadAction<string | null>) => {
      state.activeAudioTrackId = action.payload;
    },

    // Subtitle Actions
    addSubtitle: (state, action: PayloadAction<Subtitle>) => {
      state.subtitles.push(action.payload);
    },
    removeSubtitle: (state, action: PayloadAction<string>) => {
      state.subtitles = state.subtitles.filter(
        (sub) => sub.id !== action.payload
      );
    },
    updateSubtitle: (
      state,
      action: PayloadAction<{
        id: string;
        text?: string;
        startTime?: number;
        endTime?: number;
        position?: "top" | "middle" | "bottom";
        style?: Partial<SubtitleStyle>;
      }>
    ) => {
      const subtitle = state.subtitles.find((s) => s.id === action.payload.id);
      if (subtitle) {
        if (action.payload.text) subtitle.text = action.payload.text;
        if (action.payload.startTime)
          subtitle.startTime = action.payload.startTime;
        if (action.payload.endTime) subtitle.endTime = action.payload.endTime;
        if (action.payload.position)
          subtitle.position = action.payload.position;
        if (action.payload.style) {
          subtitle.style = {
            ...subtitle.style,
            ...action.payload.style,
          };
        }
      }
    },
    addToVideoLibrary: (state, action: PayloadAction<VideoLibraryItem>) => {
      state.videoLibrary.push(action.payload);
    },

    removeFromVideoLibrary: (state, action: PayloadAction<string>) => {
      state.videoLibrary = state.videoLibrary.filter(
        (video) => video.id !== action.payload
      );
    },

    updateVideoInLibrary: (
      state,
      action: PayloadAction<{
        id: string;
        name?: string;
        previewUrl?: string;
        duration?: number;
      }>
    ) => {
      const video = state.videoLibrary.find((v) => v.id === action.payload.id);
      if (video) {
        if (action.payload.name) video.name = action.payload.name;
        if (action.payload.previewUrl)
          video.previewUrl = action.payload.previewUrl;
        if (action.payload.duration) video.duration = action.payload.duration;
      }
    },
  },
});

export const {
  setCurrentTime,
  togglePlay,
  setZoomLevel,
  recalculateDuration,
  addClipToTimeline,
  removeClipFromTimeline,
  moveClipInTimeline,
  trimClip,
  splitClip,
  updateTimelineClips,
  addImageOverlay,
  removeImageOverlay,
  updateImageOverlay,
  addAudioTrack,
  updateAudioTrack,
  removeAudioTrack,
  splitAudioTrack,
  trimAudioTrack,
  setActiveAudioTrack,
  addSubtitle,
  removeSubtitle,
  updateSubtitle,
} = editorSlice.actions;

export default editorSlice.reducer;
