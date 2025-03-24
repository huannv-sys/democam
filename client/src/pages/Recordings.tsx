import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';
import { formatDate, formatDuration } from '../lib/utils';

interface Recording {
  id: string;
  cameraId: string;
  cameraName?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  size?: number;
  path: string;
  type: 'manual' | 'scheduled' | 'motion' | 'alert';
}

export default function Recordings() {
  const queryClient = useQueryClient();
  const [selectedCamera, setSelectedCamera] = React.useState<string | 'all'>('all');
  const [dateRange, setDateRange] = React.useState<{ start?: Date; end?: Date }>({});

  const { data: cameras, isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => apiRequest('/api/cameras'),
  });

  const { data: recordings, isLoading: recordingsLoading } = useQuery({
    queryKey: ['recordings', selectedCamera, dateRange],
    queryFn: () => {
      let url = '/api/recordings';
      const params: string[] = [];
      
      if (selectedCamera !== 'all') {
        params.push(`cameraId=${selectedCamera}`);
      }
      
      if (dateRange.start) {
        params.push(`startDate=${dateRange.start.toISOString()}`);
      }
      
      if (dateRange.end) {
        params.push(`endDate=${dateRange.end.toISOString()}`);
      }
      
      if (params.length) {
        url += `?${params.join('&')}`;
      }
      
      return apiRequest(url);
    },
  });

  const getRecordingTypeInfo = (type: string) => {
    switch (type) {
      case 'motion':
        return {
          label: 'Motion Triggered',
          color: 'bg-yellow-100 text-yellow-800',
        };
      case 'alert':
        return {
          label: 'Alert Triggered',
          color: 'bg-red-100 text-red-800',
        };
      case 'scheduled':
        return {
          label: 'Scheduled',
          color: 'bg-blue-100 text-blue-800',
        };
      case 'manual':
        return {
          label: 'Manual Recording',
          color: 'bg-green-100 text-green-800',
        };
      default:
        return {
          label: type,
          color: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const deleteRecordingMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/recordings/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      toast({
        title: "Recording Deleted",
        description: "The recording has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to delete recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  const handleDeleteRecording = (id: string) => {
    if (confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      deleteRecordingMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recordings</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Recordings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="camera" className="text-sm font-medium">
                Camera
              </label>
              <select
                id="camera"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
              >
                <option value="all">All Cameras</option>
                {!camerasLoading && cameras?.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={dateRange.start ? dateRange.start.toISOString().substring(0, 10) : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setDateRange((prev) => ({ ...prev, start: date }));
                }}
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={dateRange.end ? dateRange.end.toISOString().substring(0, 10) : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : undefined;
                  setDateRange((prev) => ({ ...prev, end: date }));
                }}
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recordings List */}
      {recordingsLoading ? (
        <div>Loading recordings...</div>
      ) : recordings?.length ? (
        <div className="space-y-4">
          {recordings.map((recording: Recording) => {
            const typeInfo = getRecordingTypeInfo(recording.type);
            
            return (
              <Card key={recording.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <h3 className="font-semibold">
                          {recording.cameraName || 'Unknown Camera'}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(recording.startTime).toLocaleString()}
                        {recording.endTime && ` - ${new Date(recording.endTime).toLocaleString()}`}
                      </p>
                      <p className="text-sm">
                        Duration: {formatDuration(recording.duration)}
                        {recording.size && ` • Size: ${(recording.size / (1024 * 1024)).toFixed(2)} MB`}
                      </p>
                    </div>
                    <div className="flex mt-4 md:mt-0 space-x-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          toast({
                            title: "Downloading Recording",
                            description: "This feature is not implemented in the demo.",
                          });
                        }}
                      >
                        Download
                      </Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleDeleteRecording(recording.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p>No recordings found matching the selected filters.</p>
            {(selectedCamera !== 'all' || dateRange.start || dateRange.end) && (
              <Button 
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSelectedCamera('all');
                  setDateRange({});
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}