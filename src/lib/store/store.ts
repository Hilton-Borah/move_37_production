import { configureStore } from '@reduxjs/toolkit';
import editorReducer from './editorSlice';

export const store = configureStore({
  reducer: {
    editor: editorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['editor/addVideoClip'],
        ignoredPaths: ['editor.videoClips'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;