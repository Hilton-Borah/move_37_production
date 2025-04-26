import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-6">Video Editing Platform</h1>
        <p className="text-xl mb-10 text-gray-300">
          Create stunning videos with our web-based editor. No downloads required.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/editor">
            <Button size="lg" className="px-8 py-6 text-lg">
              Start Editing
            </Button>
          </Link>
          
          <Link href="/about">
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
              Learn More
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Easy Upload</h3>
            <p className="text-gray-400">
              Drag and drop your videos to get started instantly.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Powerful Editing</h3>
            <p className="text-gray-400">
              Trim, cut, and arrange clips with our intuitive timeline.
            </p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Export Anywhere</h3>
            <p className="text-gray-400">
              Download your creations in multiple formats.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}