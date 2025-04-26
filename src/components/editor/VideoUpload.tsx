'use client';

import { useDropzone } from 'react-dropzone';
import { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { addToVideoLibrary, removeFromVideoLibrary } from '@/lib/store/editorSlice';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Video, Trash2, PlusCircle } from 'lucide-react';
import VideoLibraryItem from '../VideoLibraryItem';

export default function VideoUpload() {
  const dispatch = useDispatch();
  const { videoLibrary } = useSelector((state: RootState) => state.editor);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [clipName, setClipName] = useState('');

  // Handle upload progress
  useEffect(() => {
    if (Object.keys(uploadProgress).length === 0) return;

    const intervals: Record<string, NodeJS.Timeout> = {};

    Object.keys(uploadProgress).forEach(fileId => {
      if (uploadProgress[fileId] < 100) {
        intervals[fileId] = setInterval(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            if (newProgress[fileId] < 100) {
              newProgress[fileId] += 10;
            } else {
              clearInterval(intervals[fileId]);
            }
            return newProgress;
          });
        }, 300);
      }
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [uploadProgress]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsUploading(true);
    const newProgress: Record<string, number> = {};
    
    acceptedFiles.forEach((file) => {
      const fileId = `clip-${Date.now()}-${file.name}`;
      newProgress[fileId] = 0;
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      // Set initial progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      // Simulate upload completion
      setTimeout(() => {
        dispatch(addToVideoLibrary({
          id: fileId,
          name: clipName || file.name.replace(/\.[^/.]+$/, ''),
          previewUrl,
          startTime: 0,
          endTime: 30,
          duration: 30,
          file,
        }));
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          if (Object.keys(updated).length === 0) {
            setIsUploading(false);
          }
          return updated;
        });
      }, 3000);
    });

    setUploadProgress(newProgress);
  }, [dispatch, clipName]);

  const handleDeleteVideo = (id: string) => {
    dispatch(removeFromVideoLibrary(id));
  };

  const handleAddSample = () => {
    dispatch(addToVideoLibrary({
      id: `sample-${Date.now()}`,
      name: 'Sample Video',
      previewUrl: '/sample.mp4',
      startTime: 0,
      endTime: 60,
      duration: 60,
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    maxFiles: 10,
    multiple: true,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Video Upload</h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer mb-2 ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-1">
            <Video className="h-8 w-8 text-gray-400" />
            <p className="text-sm">
              {isDragActive ? "Drop video files here" : "Drag & drop videos or click to browse"}
            </p>
            <p className="text-xs text-gray-500">Supports MP4, MOV, AVI, WEBM</p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4 space-y-2">
          <Input
            value={clipName}
            onChange={(e) => setClipName(e.target.value)}
            placeholder="Name for all clips"
            className="mb-2"
          />
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div key={fileId} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="truncate">
                  {fileId.split('-').slice(2).join('-').replace(/\.[^/.]+$/, '')}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </div>
      )}

      {/* Video Library */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-md font-medium mb-2">Video Library</h3>
        {videoLibrary.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No videos uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {videoLibrary.map((video) => (
              <VideoLibraryItem
                key={video.id}
                id={video.id}
                name={video.name}
                previewUrl={video.previewUrl}
                duration={video.duration}
                onDelete={handleDeleteVideo}
              />
            ))}
          </div>
        )}
      </div>

      <Button
        variant="outline"
        className="mt-4"
        onClick={handleAddSample}
      >
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Sample Video
      </Button>
    </div>
  );
}