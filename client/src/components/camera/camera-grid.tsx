import { useQuery } from "@tanstack/react-query";
import CameraFeed from "./camera-feed";
import { Camera } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function CameraGrid() {
  // Fetch cameras
  const { data: cameras, isLoading } = useQuery<Camera[]>({
    queryKey: ['/api/cameras'],
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-video relative rounded overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!cameras || cameras.length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center text-secondary-500">
          <h3 className="text-xl font-semibold mb-2">No Cameras Found</h3>
          <p className="mb-4">Add a camera to get started with monitoring</p>
          <button className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Add Camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
      {cameras.map(camera => (
        <CameraFeed key={camera.id} camera={camera} />
      ))}
    </div>
  );
}
