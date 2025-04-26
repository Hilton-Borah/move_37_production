'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addImageOverlay } from '@/lib/store/editorSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useDropzone } from 'react-dropzone';

export default function ImageOverlay() {
  const dispatch = useDispatch();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [opacity, setOpacity] = useState(100);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 200, height: 200 });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
      }
    }
  });

  const handleAddOverlay = () => {
    if (!imageFile) return;

    dispatch(addImageOverlay({
      id: `overlay-${Date.now()}`,
      url: previewUrl,
      startTime: 0,
      endTime: 10, // Default 10 seconds duration
      position: { x: position.x, y: position.y },
      size: { width: size.width, height: size.height },
      opacity: opacity / 100,
      rotation: 0
    }));

    // Reset form
    setImageFile(null);
    setPreviewUrl('');
    setOpacity(100);
    setPosition({ x: 50, y: 50 });
    setSize({ width: 200, height: 200 });
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Image Overlay</h2>
      
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer mb-4"
      >
        <input {...getInputProps()} />
        {previewUrl ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-h-32 mx-auto mb-2"
          />
        ) : (
          <p>Drag & drop an image here, or click to select</p>
        )}
      </div>

      {previewUrl && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Opacity</label>
            <Slider
              value={[opacity]}
              onValueChange={(value) => setOpacity(value[0])}
              min={10}
              max={100}
              step={5}
            />
            <span className="text-xs text-gray-600">{opacity}%</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Position X</label>
              <Slider
                value={[position.x]}
                onValueChange={(value) => setPosition(prev => ({ ...prev, x: value[0] }))}
                min={0}
                max={100}
              />
              <span className="text-xs text-gray-600">{position.x}%</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position Y</label>
              <Slider
                value={[position.y]}
                onValueChange={(value) => setPosition(prev => ({ ...prev, y: value[0] }))}
                min={0}
                max={100}
              />
              <span className="text-xs text-gray-600">{position.y}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Width</label>
              <Input
                type="number"
                value={size.width}
                onChange={(e) => setSize(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                min={50}
                max={800}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Height</label>
              <Input
                type="number"
                value={size.height}
                onChange={(e) => setSize(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                min={50}
                max={800}
              />
            </div>
          </div>

          <Button 
            onClick={handleAddOverlay}
            className="w-full mt-4"
          >
            Add Overlay to Timeline
          </Button>
        </div>
      )}
    </div>
  );
}