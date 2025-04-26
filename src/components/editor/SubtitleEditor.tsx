import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SubtitleEditor() {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Subtitles</h2>
      
      <div className="space-y-4">
        <Input placeholder="Enter subtitle text" />
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium">Start Time</label>
            <Input type="number" placeholder="0.0" step="0.1" />
          </div>
          <div>
            <label className="text-sm font-medium">End Time</label>
            <Input type="number" placeholder="5.0" step="0.1" />
          </div>
        </div>
        
        <div>
          <label className="text-sm font-medium">Position</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Bottom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="middle">Middle</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" size="sm">Add Subtitle</Button>
          <Button variant="outline" size="sm">Style Text</Button>
        </div>
      </div>
    </div>
  );
}