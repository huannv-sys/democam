import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';

interface Camera {
  id: string;
  name: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  model?: string;
  manufacturer?: string;
  location?: string;
  status?: 'online' | 'offline';
  lastSeen?: string;
  onvifPort?: number;
  rtspUrl?: string;
}

interface AddCameraFormData {
  name: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  location?: string;
  onvifPort?: number;
  rtspUrl?: string;
}

export default function Cameras() {
  const queryClient = useQueryClient();
  const [isAddingCamera, setIsAddingCamera] = React.useState(false);
  const [formData, setFormData] = React.useState<AddCameraFormData>({
    name: '',
    ip: '',
    port: 80,
    username: '',
    password: '',
    onvifPort: 2020,
  });

  const { data: cameras, isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => apiRequest('/api/cameras'),
  });

  const addCameraMutation = useMutation({
    mutationFn: (newCamera: AddCameraFormData) => 
      apiRequest('/api/cameras', { 
        method: 'POST',
        body: JSON.stringify(newCamera)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      setIsAddingCamera(false);
      setFormData({
        name: '',
        ip: '',
        port: 80,
        username: '',
        password: '',
        onvifPort: 2020,
      });
      toast({
        title: "Camera Added",
        description: "The camera has been successfully added.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add camera: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  const deleteCameraMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/cameras/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cameras'] });
      toast({
        title: "Camera Removed",
        description: "The camera has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to remove camera: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  const testCameraConnection = async (id: string) => {
    try {
      toast({
        title: "Testing Connection",
        description: "Checking camera connectivity...",
      });

      const result = await apiRequest(`/api/cameras/${id}/test`, { method: 'POST' });
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "The camera is online and accessible.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: result.message || "Could not connect to the camera. Please check the settings.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: `Could not perform connection test: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCameraMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cameras</h1>
        <Button onClick={() => setIsAddingCamera(!isAddingCamera)}>
          {isAddingCamera ? 'Cancel' : 'Add Camera'}
        </Button>
      </div>

      {isAddingCamera && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Camera</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Camera Name*
                  </label>
                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="Living Room Camera"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location
                  </label>
                  <input
                    id="location"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="Living Room"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="ip" className="text-sm font-medium">
                    IP Address*
                  </label>
                  <input
                    id="ip"
                    name="ip"
                    value={formData.ip}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="192.168.1.100"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="port" className="text-sm font-medium">
                    HTTP Port
                  </label>
                  <input
                    id="port"
                    name="port"
                    type="number"
                    value={formData.port}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="80"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="onvifPort" className="text-sm font-medium">
                    ONVIF Port
                  </label>
                  <input
                    id="onvifPort"
                    name="onvifPort"
                    type="number"
                    value={formData.onvifPort || ''}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="2020"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="rtspUrl" className="text-sm font-medium">
                    RTSP URL (optional)
                  </label>
                  <input
                    id="rtspUrl"
                    name="rtspUrl"
                    value={formData.rtspUrl || ''}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="rtsp://192.168.1.100:554/stream1"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Username*
                  </label>
                  <input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="admin"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password*
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit" disabled={addCameraMutation.isPending}>
                  {addCameraMutation.isPending ? 'Adding...' : 'Add Camera'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div>Loading cameras...</div>
      ) : cameras?.length ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cameras.map((camera: Camera) => (
            <Card key={camera.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <CardTitle>{camera.name}</CardTitle>
                  <div className="flex items-center">
                    <span 
                      className={`h-2 w-2 rounded-full mr-2 ${
                        camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                      }`} 
                    />
                    <span className="text-xs capitalize">{camera.status || 'unknown'}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-100 mb-4 flex items-center justify-center">
                  <div className="text-gray-400">Camera Preview</div>
                  {/* In a real app, this would be a actual camera stream */}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Model:</span>
                    <span>{camera.model || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">IP Address:</span>
                    <span>{camera.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location:</span>
                    <span>{camera.location || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Seen:</span>
                    <span>{camera.lastSeen ? new Date(camera.lastSeen).toLocaleString() : 'Never'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={() => testCameraConnection(camera.id)}
                >
                  Test Connection
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (confirm('Are you sure you want to remove this camera?')) {
                      deleteCameraMutation.mutate(camera.id);
                    }
                  }}
                >
                  Remove
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="mb-4">No cameras have been added yet.</p>
            <p className="text-sm text-gray-500 mb-4">
              Add your first camera to start monitoring.
            </p>
            {!isAddingCamera && (
              <Button onClick={() => setIsAddingCamera(true)}>
                Add Your First Camera
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}