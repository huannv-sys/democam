import { useState, useEffect, useRef } from "react";
import { Camera, Video, Expand, Circle, AlertTriangle, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Camera as CameraType } from "@shared/schema";
import { format } from "date-fns";

interface CameraFeedProps {
  camera: CameraType;
}

export default function CameraFeed({ camera }: CameraFeedProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState<boolean>(camera.isRecording || false);
  const [currentTime, setCurrentTime] = useState<string>(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
  const [motionDetected, setMotionDetected] = useState<boolean>(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Setup WebSocket connection for streaming
  useEffect(() => {
    if (camera.status === 'offline') return;
    
    // Create WebSocket connection for this camera
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/stream?cameraId=${camera.id}`);
    
    ws.onopen = () => {
      console.log(`WebSocket connected for camera ${camera.id}`);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Update the video element with the frame data
        if (videoRef.current && data.frame) {
          // In a real app with actual video streams, this would use WebRTC or similar
          // For this demo, we'll simulate with canvas or img elements
          
          // Check if the stream indicates motion
          if (data.hasMotion) {
            setMotionDetected(true);
            setTimeout(() => setMotionDetected(false), 5000); // Reset motion indicator after 5 seconds
          }
        }
      } catch (error) {
        console.error('Error processing camera feed message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error(`WebSocket error for camera ${camera.id}:`, error);
      toast({
        title: "Connection Error",
        description: `Failed to connect to camera ${camera.name}`,
        variant: "destructive",
      });
    };
    
    ws.onclose = () => {
      console.log(`WebSocket closed for camera ${camera.id}`);
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [camera.id, camera.name, camera.status, toast]);

  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/cameras/${camera.id}/start-recording`, {});
    },
    onSuccess: () => {
      setIsRecording(true);
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      toast({
        title: "Recording Started",
        description: `Recording started for ${camera.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Recording Error",
        description: `Failed to start recording: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Stop recording mutation
  const stopRecordingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/cameras/${camera.id}/stop-recording`, {});
    },
    onSuccess: () => {
      setIsRecording(false);
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      toast({
        title: "Recording Stopped",
        description: `Recording stopped for ${camera.name}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Recording Error",
        description: `Failed to stop recording: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecordingMutation.mutate();
    } else {
      startRecordingMutation.mutate();
    }
  };

  // Handle expand to fullscreen
  const handleExpand = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen().catch((err) => {
          toast({
            title: "Fullscreen Error",
            description: `Error attempting to enable fullscreen: ${err.message}`,
            variant: "destructive",
          });
        });
      }
    }
  };

  // Take snapshot
  const handleTakeSnapshot = () => {
    // In a real app, this would capture a frame and save it
    toast({
      title: "Snapshot Taken",
      description: `Snapshot captured from ${camera.name}`,
    });
  };

  // Handle reconnection
  const handleReconnect = () => {
    // In a real app, this would attempt to reconnect to the camera
    toast({
      title: "Reconnecting",
      description: `Attempting to reconnect to ${camera.name}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-inactive';
    }
  };

  return (
    <div 
      ref={videoRef}
      className="video-feed rounded shadow-lg bg-secondary-950 h-full aspect-video relative" 
      data-camera-id={camera.id}
    >
      {camera.status === 'offline' ? (
        // Offline camera view
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-secondary-400">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Camera Offline</p>
            <button 
              className="mt-3 px-3 py-1 bg-secondary-800 text-secondary-300 rounded text-sm hover:bg-secondary-700 transition"
              onClick={handleReconnect}
            >
              Reconnect
            </button>
          </div>
        </div>
      ) : (
        // Online camera - we'd display the actual video stream here
        // For demo purposes, showing a placeholder
        <div className="absolute inset-0 bg-secondary-900 flex items-center justify-center">
          <div className="text-secondary-400">
            {/* This would be a real video stream in production */}
            <svg
              className="w-full h-full max-w-[320px] max-h-[240px]"
              viewBox="0 0 640 480"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="640" height="480" fill="#1e1e1e" />
              <text
                x="320"
                y="240"
                fontFamily="Arial"
                fontSize="24"
                fill="#666"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {camera.name} Feed
              </text>
              <text
                x="320"
                y="280"
                fontFamily="monospace"
                fontSize="16"
                fill="#888"
                textAnchor="middle"
              >
                {currentTime}
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* Motion detection overlay */}
      {motionDetected && (
        <div className="absolute top-0 left-0 right-0 bottom-0 motion-alert"></div>
      )}

      {/* Top gradient and camera info */}
      <div className="absolute top-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-b from-secondary-900/80 to-transparent">
        <div className="flex items-center">
          <span className={`mr-2 ${getStatusColor(camera.status)}`}>
            <Circle className="h-2 w-2 fill-current" />
          </span>
          <span className="text-white text-sm font-medium">{camera.name}</span>
        </div>
        <div className="text-white text-xs font-mono">
          <span>{camera.status === 'offline' ? '--:--:--' : currentTime}</span>
        </div>
      </div>

      {/* Bottom gradient and controls */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center bg-gradient-to-t from-secondary-900/80 to-transparent">
        <div className="flex space-x-3">
          <button 
            className={`text-white opacity-80 hover:opacity-100 ${isRecording ? 'text-danger' : ''}`}
            onClick={toggleRecording}
            disabled={camera.status === 'offline'}
          >
            <Video className="h-4 w-4" />
          </button>
          <button 
            className="text-white opacity-80 hover:opacity-100"
            onClick={handleTakeSnapshot}
            disabled={camera.status === 'offline'}
          >
            <Camera className="h-4 w-4" />
          </button>
          <button 
            className="text-white opacity-80 hover:opacity-100"
            onClick={handleExpand}
            disabled={camera.status === 'offline'}
          >
            <Expand className="h-4 w-4" />
          </button>
        </div>
        <div className="flex space-x-2">
          {motionDetected && (
            <span className="bg-danger px-2 py-0.5 rounded text-xs text-white flex items-center">
              <Activity className="mr-1 w-3 h-3" /> MOTION
            </span>
          )}
          {camera.status === 'online' && (
            <span className="bg-success px-2 py-0.5 rounded text-xs text-white">LIVE</span>
          )}
        </div>
      </div>
    </div>
  );
}


