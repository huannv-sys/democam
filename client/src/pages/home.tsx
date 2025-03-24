import CameraGrid from "@/components/camera/camera-grid";
import PlaybackControls from "@/components/timeline/playback-controls";
import AlertSidebar from "@/components/layout/alert-sidebar";
import { useState } from "react";

export default function Home() {
  const [selectedCamera, setSelectedCamera] = useState<number | "all">("all");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  const handleCameraSelect = (cameraId: number | "all") => {
    setSelectedCamera(cameraId);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePlaybackSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Camera Grid Section */}
      <CameraGrid />

      {/* Timeline and Controls Section */}
      <div className="bg-white border-t border-secondary-200 shadow-md">
        <PlaybackControls 
          onCameraSelect={handleCameraSelect}
          onDateChange={handleDateChange}
          onPlaybackSpeedChange={handlePlaybackSpeedChange}
        />
      </div>

      {/* Alert Sidebar - hidden on mobile */}
      <AlertSidebar />
    </main>
  );
}
