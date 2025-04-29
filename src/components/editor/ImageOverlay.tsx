'use client';

import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addImageOverlay } from '@/lib/store/editorSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useDropzone } from 'react-dropzone';
import { useDrag } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { X, Move, Clock } from 'lucide-react';

interface ImagePreview {
  id: string;
  file: File;
  url: string;
  name: string;
  duration: number;
  opacity: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
}

export default function ImageOverlay() {
  const dispatch = useDispatch();
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [selectedPreviewId, setSelectedPreviewId] = useState<string | null>(null);
  const [defaultDuration, setDefaultDuration] = useState(5);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 10,
    onDrop: (acceptedFiles) => {
      const newPreviews = acceptedFiles.map(file => ({
        id: uuidv4(),
        file,
        url: URL.createObjectURL(file),
        name: file.name.replace(/\.[^/.]+$/, ""),
        duration: defaultDuration,
        opacity: 100,
        position: { x: 50, y: 50 },
        size: { width: 200, height: 200 },
        rotation: 0
      }));
      
      setPreviews(prev => [...prev, ...newPreviews]);
      if (!selectedPreviewId && newPreviews.length > 0) {
        setSelectedPreviewId(newPreviews[0].id);
      }
    }
  });

  const removePreview = (id: string) => {
    setPreviews(prev => {
      const newPreviews = prev.filter(p => p.id !== id);
      const previewToRemove = prev.find(p => p.id === id);
      if (previewToRemove) URL.revokeObjectURL(previewToRemove.url);
      
      if (selectedPreviewId === id) {
        setSelectedPreviewId(newPreviews.length > 0 ? newPreviews[0].id : null);
      }
      
      return newPreviews;
    });
  };

  const updatePreview = (id: string, updates: Partial<ImagePreview>) => {
    setPreviews(prev => 
      prev.map(p => 
        p.id === id ? { ...p, ...updates } : p
      )
    );
  };

  const handleAddToTimeline = (preview: ImagePreview) => {
    dispatch(addImageOverlay({
      id: `img-${uuidv4()}`,
      url: preview.url,
      name: preview.name,
      type: 'image', // Add this to distinguish from videos
      startTime: 0, // Will be calculated when added to timeline
      endTime: preview.duration,
      duration: preview.duration,
      position: preview.position,
      size: preview.size,
      opacity: preview.opacity / 100,
      rotation: preview.rotation
    }));
  };

  const handleAddAllToTimeline = () => {
    previews.forEach(preview => {
      dispatch(addImageOverlay({
        id: `img-${uuidv4()}`,
        url: preview.url,
        name: preview.name,
        type: 'image',
        startTime: 0,
        endTime: preview.duration,
        duration: preview.duration,
        position: preview.position,
        size: preview.size,
        opacity: preview.opacity / 100,
        rotation: preview.rotation
      }));
    });
  };

  const DraggableImage = ({ preview }: { preview: ImagePreview }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'IMAGE_OVERLAY',
      item: {
        type: 'IMAGE_OVERLAY',
        previewUrl: preview.url,
        duration: preview.duration,
        name: preview.name,
        size: preview.size,
        opacity: preview.opacity / 100,
        position: preview.position,
        rotation: preview.rotation
      },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    return (
      <div
        ref={drag}
        className={`relative group cursor-grab ${isDragging ? 'opacity-50' : 'opacity-100'} ${
          selectedPreviewId === preview.id ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={() => setSelectedPreviewId(preview.id)}
      >
        <img
          src={preview.url}
          alt="Preview"
          className="h-24 w-full object-contain bg-gray-100 rounded"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
          <Move className="text-white opacity-0 group-hover:opacity-100" size={20} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 truncate">
          {preview.name}
          <div className="flex items-center justify-center text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {preview.duration}s
          </div>
        </div>
        <button
          className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            removePreview(preview.id);
          }}
        >
          <X size={16} className="text-white" />
        </button>
      </div>
    );
  };

  const selectedPreview = previews.find(p => p.id === selectedPreviewId);

  return (
    <div className="mb-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-2">Image Overlay</h2>
      
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer mb-4"
      >
        <input {...getInputProps()} />
        <p>Drag & drop images here, or click to select</p>
        <p className="text-xs text-gray-500">Supports multiple images (max 10 at once)</p>
      </div>

      {previews.length > 0 && (
        <div className="flex flex-col flex-1 gap-4">
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {previews.map(preview => (
              <DraggableImage key={preview.id} preview={preview} />
            ))}
          </div>

          <div className="border-t pt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default Duration (seconds)</label>
              <Input
                type="number"
                value={defaultDuration}
                onChange={(e) => {
                  const newDuration = Math.max(1, parseInt(e.target.value) || 1);
                  setDefaultDuration(newDuration);
                  // Update duration for all previews that haven't been customized
                  setPreviews(prev => prev.map(p => 
                    p.duration === defaultDuration ? { ...p, duration: newDuration } : p
                  ));
                }}
                min={1}
                max={60}
              />
            </div>

            {selectedPreview && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{selectedPreview.name}</h3>
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => handleAddToTimeline(selectedPreview)}
                  >
                    Add to Timeline
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Duration (seconds)</label>
                  <Input
                    type="number"
                    value={selectedPreview.duration}
                    onChange={(e) => updatePreview(selectedPreview.id, { 
                      duration: Math.max(0.1, parseFloat(e.target.value) || 1) 
                    })}
                    min={0.1}
                    max={60}
                    step={0.1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Opacity</label>
                  <Slider
                    value={[selectedPreview.opacity]}
                    onValueChange={(value) => updatePreview(selectedPreview.id, { opacity: value[0] })}
                    min={10}
                    max={100}
                    step={5}
                  />
                  <span className="text-xs text-gray-600">{selectedPreview.opacity}%</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Position X</label>
                    <Slider
                      value={[selectedPreview.position.x]}
                      onValueChange={(value) => updatePreview(selectedPreview.id, { 
                        position: { ...selectedPreview.position, x: value[0] } 
                      })}
                      min={0}
                      max={100}
                    />
                    <span className="text-xs text-gray-600">{selectedPreview.position.x}%</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Position Y</label>
                    <Slider
                      value={[selectedPreview.position.y]}
                      onValueChange={(value) => updatePreview(selectedPreview.id, { 
                        position: { ...selectedPreview.position, y: value[0] } 
                      })}
                      min={0}
                      max={100}
                    />
                    <span className="text-xs text-gray-600">{selectedPreview.position.y}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Width</label>
                    <Input
                      type="number"
                      value={selectedPreview.size.width}
                      onChange={(e) => updatePreview(selectedPreview.id, { 
                        size: { ...selectedPreview.size, width: parseInt(e.target.value) || 50 } 
                      })}
                      min={50}
                      max={800}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Height</label>
                    <Input
                      type="number"
                      value={selectedPreview.size.height}
                      onChange={(e) => updatePreview(selectedPreview.id, { 
                        size: { ...selectedPreview.size, height: parseInt(e.target.value) || 50 } 
                      })}
                      min={50}
                      max={800}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleAddAllToTimeline}
              className="w-full"
              variant="secondary"
            >
              Add All Images to Timeline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}