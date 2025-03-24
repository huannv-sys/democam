import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutGrid, 
  History, 
  Bell, 
  Folder, 
  BarChart,
  MoreVertical,
  Plus,
  Circle
} from "lucide-react";
import { Camera } from "@shared/schema";
import { useState } from "react";
import AddCameraDialog from "@/components/camera/add-camera-dialog";

export default function Sidebar() {
  const [location] = useLocation();
  const [isAddCameraOpen, setIsAddCameraOpen] = useState(false);

  // Fetch cameras
  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ['/api/cameras'],
  });

  // Fetch system stats
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Calculate storage percentage
  const storageLimit = settings?.storageLimit || 2048; // 2TB default
  const usedStorage = 1228; // Mock value for demonstration (1.2TB)
  const storagePercentage = Math.round((usedStorage / storageLimit) * 100);

  return (
    <aside className="bg-secondary-950 text-white w-64 flex-shrink-0 overflow-y-auto">
      <nav className="p-4">
        <div className="mb-6">
          <h2 className="text-secondary-400 text-xs uppercase tracking-wider mb-3">Main Menu</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/">
                <a className={`flex items-center px-3 py-2 rounded ${location === '/' ? 'bg-primary-600 text-white' : 'text-secondary-300 hover:bg-secondary-800'} transition`}>
                  <LayoutGrid className="mr-3 h-4 w-4" />
                  <span>Live View</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/playback">
                <a className={`flex items-center px-3 py-2 rounded ${location === '/playback' ? 'bg-primary-600 text-white' : 'text-secondary-300 hover:bg-secondary-800'} transition`}>
                  <History className="mr-3 h-4 w-4" />
                  <span>Playback</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/alerts">
                <a className={`flex items-center px-3 py-2 rounded ${location === '/alerts' ? 'bg-primary-600 text-white' : 'text-secondary-300 hover:bg-secondary-800'} transition`}>
                  <Bell className="mr-3 h-4 w-4" />
                  <span>Alerts</span>
                  {/* Alert badge - we'll fetch this from API in real app */}
                  <span className="ml-auto bg-amber-500 text-xs font-semibold px-2 py-0.5 rounded-full">3</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/recordings">
                <a className={`flex items-center px-3 py-2 rounded ${location === '/recordings' ? 'bg-primary-600 text-white' : 'text-secondary-300 hover:bg-secondary-800'} transition`}>
                  <Folder className="mr-3 h-4 w-4" />
                  <span>Recordings</span>
                </a>
              </Link>
            </li>
            <li>
              <a className="flex items-center px-3 py-2 rounded text-secondary-300 hover:bg-secondary-800 transition cursor-pointer">
                <BarChart className="mr-3 h-4 w-4" />
                <span>Analytics</span>
              </a>
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-secondary-400 text-xs uppercase tracking-wider mb-3">Camera Management</h2>
          
          {cameras.map(camera => (
            <div 
              key={camera.id}
              className="flex items-center justify-between py-2 px-3 mb-2 rounded hover:bg-secondary-800 transition cursor-pointer"
            >
              <div className="flex items-center">
                <span className={`mr-2 flex items-center ${
                  camera.status === 'online' 
                    ? 'text-success' 
                    : camera.status === 'warning' 
                      ? 'text-warning' 
                      : 'text-inactive'
                }`}>
                  <Circle className="h-2 w-2 fill-current" />
                </span>
                <span className="text-sm">{camera.name}</span>
              </div>
              <div className="text-secondary-400">
                <MoreVertical className="h-4 w-4" />
              </div>
            </div>
          ))}
          
          <div className="mt-3">
            <button 
              className="flex items-center justify-center w-full px-3 py-2 text-sm bg-secondary-800 rounded hover:bg-secondary-700 transition"
              onClick={() => setIsAddCameraOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Add Camera</span>
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-secondary-400 text-xs uppercase tracking-wider mb-3">System</h2>
          <div className="bg-secondary-800 rounded p-3 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-secondary-400">Storage:</span>
              <span>{(usedStorage/1024).toFixed(1)}TB / {(storageLimit/1024).toFixed(1)}TB</span>
            </div>
            <div className="w-full bg-secondary-700 rounded-full h-2 mb-4">
              <div 
                className="bg-primary-500 h-2 rounded-full" 
                style={{ width: `${storagePercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-secondary-400">CPU:</span>
              <span>24%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-400">Network:</span>
              <span>5.8 Mbps</span>
            </div>
          </div>
        </div>
      </nav>

      <AddCameraDialog 
        open={isAddCameraOpen} 
        onOpenChange={setIsAddCameraOpen} 
      />
    </aside>
  );
}
