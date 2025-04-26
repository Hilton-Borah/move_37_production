'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Providers } from '@/lib/store/providers';

export default function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <DndProvider backend={HTML5Backend}>
        {children}
      </DndProvider>
    </Providers>
  );
}