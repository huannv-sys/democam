import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Recording } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import PlaybackControls from "@/components/timeline/playback-controls";
import { Video, Calendar, Clock, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatRecordingDuration } from "@/lib/recording";

export default function Playback() {
  const [selectedCamera, setSelectedCamera] = useState<number | "all">("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>("camera");

  // Fetch cameras
  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ['/api/cameras'],
  });

  // Fetch recordings
  const { data: recordings = [] } = useQuery<Recording[]>({
    queryKey: ['/api/recordings', selectedCamera !== 'all' ? selectedCamera : null],
  });

  // Filter recordings based on selected date
  const filteredRecordings = recordings.filter(recording => {
    const recordingDate = new Date(recording.startTime);
    return selectedCamera === 'all' || recording.cameraId === selectedCamera;
  });

  // Get selected camera name
  const getSelectedCameraName = () => {
    if (selectedCamera === 'all') return 'All Cameras';
    const camera = cameras.find(c => c.id === selectedCamera);
    return camera ? camera.name : 'Unknown Camera';
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header with tabs */}
      <div className="bg-white border-b border-secondary-200 p-4">
        <Tabs defaultValue="camera" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold text-secondary-900">Playback</h1>
            <TabsList>
              <TabsTrigger value="camera">Camera View</TabsTrigger>
              <TabsTrigger value="recordings">Recordings List</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="flex items-center bg-secondary-100 rounded-full px-3 py-1.5">
              <Video className="w-4 h-4 mr-2 text-secondary-500" />
              <Select onValueChange={val => setSelectedCamera(val === 'all' ? 'all' : parseInt(val))} value={selectedCamera === 'all' ? 'all' : selectedCamera.toString()}>
                <SelectTrigger className="border-0 bg-transparent h-7 min-w-[150px]">
                  <SelectValue placeholder="All Cameras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cameras</SelectItem>
                  {cameras.map(camera => (
                    <SelectItem key={camera.id} value={camera.id.toString()}>
                      {camera.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center bg-secondary-100 rounded-full px-3 py-1.5">
              <Calendar className="w-4 h-4 mr-2 text-secondary-500" />
              <span className="text-sm">Today</span>
            </div>
            
            <div className="flex items-center bg-secondary-100 rounded-full px-3 py-1.5">
              <Clock className="w-4 h-4 mr-2 text-secondary-500" />
              <span className="text-sm">All Day</span>
            </div>
            
            <Button variant="outline" size="sm" className="rounded-full h-8">
              <Filter className="w-4 h-4 mr-2" /> More Filters
            </Button>
          </div>
          
          <TabsContent value="camera" className="m-0">
            {/* Main playback view with large video */}
            <div className="bg-secondary-950 aspect-video rounded-lg overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center text-secondary-400">
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <h3 className="text-xl font-semibold">Select a recording to play</h3>
                  <p className="mt-2 max-w-md text-secondary-500">
                    Choose a date and camera from the timeline below to view recorded footage
                  </p>
                </div>
              </div>
              
              {/* Video info overlay - would show when video is playing */}
              <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-secondary-900/80 to-transparent hidden">
                <div className="flex justify-between text-white">
                  <span>{getSelectedCameraName()}</span>
                  <span className="font-mono">{format(selectedDate, 'yyyy-MM-dd HH:mm:ss')}</span>
                </div>
              </div>
            </div>
            
            {/* Timeline */}
            <div className="mt-4">
              <PlaybackControls 
                onCameraSelect={setSelectedCamera}
                onDateChange={setSelectedDate}
                onPlaybackSpeedChange={setPlaybackSpeed}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="recordings" className="m-0 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecordings.length > 0 ? (
                filteredRecordings.map(recording => {
                  const camera = cameras.find(c => c.id === recording.cameraId);
                  return (
                    <div 
                      key={recording.id} 
                      className="bg-white border border-secondary-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                    >
                      <div className="aspect-video bg-secondary-950 relative">
                        {/* This would be a thumbnail in a real app */}
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <Play className="w-10 h-10 opacity-80" />
                        </div>
                        
                        {/* Motion indicator */}
                        {recording.hasMotion && (
                          <div className="absolute top-2 right-2 bg-danger text-white text-xs px-2 py-0.5 rounded">
                            Motion
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-secondary-900">
                          {camera?.name || `Camera ${recording.cameraId}`}
                        </h3>
                        <div className="text-xs text-secondary-500 mt-1 flex justify-between">
                          <span>{format(new Date(recording.startTime), 'yyyy-MM-dd HH:mm')}</span>
                          <span>{formatRecordingDuration(recording)}</span>
                        </div>
                        <div className="mt-2 flex space-x-2">
                          <Button size="sm" className="w-full">Play</Button>
                          <Button size="sm" variant="outline" className="px-2 flex-shrink-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full flex items-center justify-center p-8 text-center text-secondary-500 bg-secondary-50 rounded-lg">
                  <div>
                    <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold">No Recordings Found</h3>
                    <p className="mt-2">
                      No recordings match your current filter criteria.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Import for icons used
import { Play, MoreHorizontal } from "lucide-react";
