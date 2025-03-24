import { useState, useEffect } from "react";
import { 
  SkipBack, 
  Rewind, 
  Play, 
  Pause,
  FastForward, 
  SkipForward,
  Calendar, 
  Clock,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Camera } from "@shared/schema";
import Timeline from "./timeline";
import { format } from "date-fns";

interface PlaybackControlsProps {
  onCameraSelect: (cameraId: number | "all") => void;
  onDateChange: (date: Date) => void;
  onPlaybackSpeedChange: (speed: number) => void;
}

export default function PlaybackControls({ 
  onCameraSelect, 
  onDateChange,
  onPlaybackSpeedChange
}: PlaybackControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<number | "all">("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fetch cameras for dropdown
  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ['/api/cameras'],
  });

  // Toggle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle camera selection
  const handleCameraChange = (value: string) => {
    const cameraId = value === "all" ? "all" : parseInt(value);
    setSelectedCamera(cameraId);
    onCameraSelect(cameraId);
  };

  // Handle date selection
  const handleDateChange = (value: string) => {
    let date: Date;
    
    switch (value) {
      case "today":
        date = new Date();
        break;
      case "yesterday":
        date = new Date();
        date.setDate(date.getDate() - 1);
        break;
      case "last7":
        date = new Date();
        date.setDate(date.getDate() - 7);
        break;
      default: // custom or today
        date = new Date();
        break;
    }
    
    setSelectedDate(date);
    onDateChange(date);
  };

  // Handle playback speed change
  const handleSpeedChange = (value: string) => {
    const speed = parseInt(value);
    setPlaybackSpeed(speed);
    onPlaybackSpeedChange(speed);
  };

  // Handle timeline time selection
  const handleTimeSelected = (timestamp: Date) => {
    setCurrentTime(timestamp);
  };

  // Format time display
  const formatTimeDisplay = (date: Date) => {
    return {
      dateStr: format(date, 'yyyy-MM-dd'),
      timeStr: format(date, 'HH:mm:ss')
    };
  };

  const displayTime = formatTimeDisplay(currentTime);

  return (
    <div className="p-4">
      <div className="flex items-center space-x-4 mb-3">
        <div className="flex items-center space-x-2">
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => console.log("Skip backward")}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => console.log("Rewind")}
          >
            <Rewind className="h-4 w-4" />
          </Button>
          <Button 
            size="icon" 
            className="rounded-full w-10 h-10 bg-primary-600 text-white hover:bg-primary-700"
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => console.log("Fast forward")}
          >
            <FastForward className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={() => console.log("Skip forward")}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm font-mono flex items-center">
          <span className="text-secondary-600">{displayTime.dateStr}</span>
          <span className="mx-2 text-secondary-400">|</span>
          <span className="font-semibold">{displayTime.timeStr}</span>
        </div>
        <div className="flex items-center ml-auto space-x-2">
          <div className="text-xs bg-secondary-100 py-1 px-2 rounded-full flex items-center">
            <Calendar className="mr-1.5 w-3.5 h-3.5 text-secondary-500" />
            <Select onValueChange={handleDateChange} defaultValue="today">
              <SelectTrigger className="border-0 h-auto p-0 bg-transparent text-secondary-800 focus:ring-0 w-24">
                <SelectValue placeholder="Today" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs bg-secondary-100 py-1 px-2 rounded-full flex items-center">
            <Clock className="mr-1.5 w-3.5 h-3.5 text-secondary-500" />
            <Select onValueChange={handleSpeedChange} defaultValue="1">
              <SelectTrigger className="border-0 h-auto p-0 bg-transparent text-secondary-800 focus:ring-0 w-12">
                <SelectValue placeholder="1x" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
                <SelectItem value="4">4x</SelectItem>
                <SelectItem value="8">8x</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs bg-secondary-100 py-1 px-2 rounded-full flex items-center">
            <Video className="mr-1.5 w-3.5 h-3.5 text-secondary-500" />
            <Select onValueChange={handleCameraChange} defaultValue="all">
              <SelectTrigger className="border-0 h-auto p-0 bg-transparent text-secondary-800 focus:ring-0 w-32">
                <SelectValue placeholder="All Cameras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cameras</SelectItem>
                {cameras.map((camera) => (
                  <SelectItem key={camera.id} value={camera.id.toString()}>
                    {camera.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Timeline 
        selectedDate={selectedDate}
        selectedCamera={selectedCamera}
        onTimeSelected={handleTimeSelected}
      />
    </div>
  );
}
