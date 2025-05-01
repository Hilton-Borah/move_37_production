'use client';

import { useDrag } from 'react-dnd';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VideoLibraryItem({ 
  id, 
  name, 
  previewUrl, 
  duration, 
  onDelete 
}: {
  id: string;
  name: string;
  previewUrl: string;
  duration: number;
  onDelete: (id: string) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'LIBRARY_VIDEO',
    item: { id, name, previewUrl, duration, type: 'LIBRARY_VIDEO' },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`flex items-center gap-3 p-2 rounded-md border border-gray-200 hover:bg-gray-50 ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="relative flex-shrink-0">
        <video
          src={previewUrl}
          className="h-12 w-20 rounded object-cover"
          muted
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-gray-500">
          {Math.round(duration)} seconds
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(id);
        }}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}