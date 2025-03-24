import { useState, useEffect } from "react";
import { Settings, User, Maximize, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        toast({
          title: "Fullscreen Error",
          description: `Error attempting to enable fullscreen: ${err.message}`,
          variant: "destructive",
        });
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleSettings = () => {
    window.location.href = "/settings";
  };

  return (
    <header className="bg-primary-600 text-white shadow-md z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Video className="w-5 h-5" />
          <h1 className="text-xl font-semibold">Camera Surveillance System</h1>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center text-sm">
            <span className="mr-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
            </span>
            <span>{isOnline ? 'System Online' : 'System Offline'}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSettings}
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              <Maximize className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" title="User">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
