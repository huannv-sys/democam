import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Recording } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Folder, 
  Search, 
  Calendar, 
  Video,
  Filter, 
  Play, 
  Download, 
  Trash2, 
  MoreHorizontal, 
  Clock,
  SlidersHorizontal 
} from "lucide-react";
import { formatRecordingDuration } from "@/lib/recording";

export default function Recordings() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  
  // Fetch cameras
  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ['/api/cameras'],
  });
  
  // Fetch recordings
  const { data: recordings = [], isLoading } = useQuery<Recording[]>({
    queryKey: ['/api/recordings', selectedCamera],
  });

  // Delete recording mutation
  const deleteRecordingMutation = useMutation({
    mutationFn: async (recordingId: number) => {
      await apiRequest('DELETE', `/api/recordings/${recordingId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
    },
  });

  // Filter recordings based on filters
  const filteredRecordings = recordings.filter(recording => {
    // Filter by camera
    if (selectedCamera && recording.cameraId !== selectedCamera) return false;
    
    // Filter by date
    if (selectedDate !== "all") {
      const recordingDate = new Date(recording.startTime);
      const today = new Date();
      
      if (selectedDate === "today") {
        // Check if recording is from today
        if (
          recordingDate.getDate() !== today.getDate() ||
          recordingDate.getMonth() !== today.getMonth() ||
          recordingDate.getFullYear() !== today.getFullYear()
        ) {
          return false;
        }
      } else if (selectedDate === "week") {
        // Check if recording is from the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (recordingDate < weekAgo) return false;
      } else if (selectedDate === "month") {
        // Check if recording is from the last 30 days
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        if (recordingDate < monthAgo) return false;
      }
    }
    
    // Filter by motion
    if (selectedFilter === "motion" && !recording.hasMotion) return false;
    
    // Search term (camera name or date)
    if (searchTerm) {
      const camera = cameras.find(c => c.id === recording.cameraId);
      const cameraName = camera ? camera.name.toLowerCase() : "";
      const recordingDate = format(new Date(recording.startTime), 'yyyy-MM-dd HH:mm');
      
      if (
        !cameraName.includes(searchTerm.toLowerCase()) &&
        !recordingDate.includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
    }
    
    return true;
  });

  // Get camera name by ID
  const getCameraName = (cameraId: number) => {
    const camera = cameras.find(c => c.id === cameraId);
    return camera ? camera.name : `Camera ${cameraId}`;
  };

  // Handle delete recording
  const handleDeleteRecording = (recordingId: number) => {
    if (confirm("Are you sure you want to delete this recording?")) {
      deleteRecordingMutation.mutate(recordingId);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-secondary-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Recordings</h1>
            <p className="text-secondary-500 mt-1">
              View and manage your camera recordings
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Recording Settings
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mb-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 h-4 w-4" />
              <Input
                className="pl-9"
                placeholder="Search recordings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline">Import</Button>
              <Button variant="outline">Export</Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Tabs defaultValue="all" value={selectedFilter} onValueChange={setSelectedFilter}>
              <TabsList>
                <TabsTrigger value="all">All Recordings</TabsTrigger>
                <TabsTrigger value="motion">Motion Events</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="ml-auto flex flex-wrap gap-2">
              <div className="flex items-center bg-secondary-100 rounded-lg px-3 py-1.5">
                <Calendar className="w-4 h-4 mr-2 text-secondary-500" />
                <Select 
                  defaultValue="all"
                  value={selectedDate}
                  onValueChange={setSelectedDate}
                >
                  <SelectTrigger className="border-0 bg-transparent h-7 min-w-[120px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center bg-secondary-100 rounded-lg px-3 py-1.5">
                <Video className="w-4 h-4 mr-2 text-secondary-500" />
                <Select 
                  defaultValue="all"
                  value={selectedCamera ? selectedCamera.toString() : "all"}
                  onValueChange={(value) => setSelectedCamera(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="border-0 bg-transparent h-7 min-w-[120px]">
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
              
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Recordings List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
            <p className="text-secondary-500">Loading recordings...</p>
          </div>
        ) : filteredRecordings.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-secondary-500 bg-secondary-50 border-b border-secondary-200">
                  <th className="font-medium text-left px-4 py-3">Camera</th>
                  <th className="font-medium text-left px-4 py-3">Date & Time</th>
                  <th className="font-medium text-left px-4 py-3">Duration</th>
                  <th className="font-medium text-left px-4 py-3">Motion</th>
                  <th className="font-medium text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecordings.map(recording => (
                  <tr 
                    key={recording.id} 
                    className="border-b border-secondary-200 hover:bg-secondary-50"
                  >
                    <td className="px-4 py-3 text-secondary-900">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded bg-secondary-200 mr-2 flex items-center justify-center text-secondary-500">
                          <Video className="w-4 h-4" />
                        </div>
                        {getCameraName(recording.cameraId)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-secondary-900">
                      {format(new Date(recording.startTime), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 text-secondary-900">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-secondary-500" />
                        {formatRecordingDuration(recording)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {recording.hasMotion ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger/10 text-danger">
                          Motion Detected
                        </span>
                      ) : (
                        <span className="text-secondary-500 text-sm">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Play className="mr-2 h-4 w-4" />
                              Play
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteRecording(recording.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm flex flex-col items-center justify-center p-12 text-center">
            <Folder className="h-16 w-16 text-secondary-300 mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Recordings Found</h3>
            <p className="text-secondary-500 max-w-md mb-6">
              {searchTerm 
                ? "No recordings match your search criteria. Try adjusting your filters."
                : "There are no recordings available for the selected filters."}
            </p>
            <Button>Start Recording</Button>
          </div>
        )}
      </div>
    </div>
  );
}
