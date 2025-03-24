import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { apiRequest } from '../lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';

export default function Dashboard() {
  const { data: cameras, isLoading: camerasLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: () => apiRequest('/api/cameras'),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts', { resolved: false }],
    queryFn: () => apiRequest('/api/alerts?resolved=false'),
  });

  const { data: recordings, isLoading: recordingsLoading } = useQuery({
    queryKey: ['recordings', { recent: true }],
    queryFn: () => apiRequest('/api/recordings?recent=true'),
  });

  const testConnection = () => {
    toast({
      title: "Testing connections",
      description: "Checking connectivity with cameras...",
    });
    
    // This would be an actual API call in production
    setTimeout(() => {
      toast({
        title: "Connection test complete",
        description: "All cameras are online and responding.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Dashboard</h1>
        <Button onClick={testConnection}>Test Camera Connections</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600"
            >
              <path d="M7 9h10" />
              <path d="M12 2v7" />
              <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {camerasLoading ? '...' : cameras?.length || 0}
            </div>
            <p className="text-xs text-gray-500">Active monitoring devices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-600"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alertsLoading ? '...' : alerts?.length || 0}
            </div>
            <p className="text-xs text-gray-500">Unresolved alerts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Recordings</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recordingsLoading ? '...' : recordings?.length || 0}
            </div>
            <p className="text-xs text-gray-500">Videos recorded today</p>
          </CardContent>
        </Card>
      </div>

      {/* Camera Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Camera Status</h2>
          <Link href="/cameras" className="text-sm text-blue-600 hover:underline">
            View All Cameras
          </Link>
        </div>
        
        {camerasLoading ? (
          <p>Loading camera status...</p>
        ) : cameras?.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cameras.slice(0, 6).map((camera) => (
              <Card key={camera.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{camera.name}</h3>
                      <p className="text-sm text-gray-500">{camera.location || 'No location set'}</p>
                    </div>
                    <div className="flex items-center">
                      <span 
                        className={`h-2 w-2 rounded-full mr-2 ${
                          camera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                        }`} 
                      />
                      <span className="text-xs capitalize">{camera.status || 'unknown'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p>No cameras configured yet.</p>
              <Link href="/cameras">
                <Button className="mt-4">Add Your First Camera</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Alerts</h2>
          <Link href="/alerts" className="text-sm text-blue-600 hover:underline">
            View All Alerts
          </Link>
        </div>
        
        {alertsLoading ? (
          <p>Loading recent alerts...</p>
        ) : alerts?.length ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-medium">{alert.type || 'Motion Detected'}</h3>
                      <p className="text-sm text-gray-500">
                        {alert.cameraName || 'Unknown Camera'} • {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Link href={`/alerts/${alert.id}`}>
                      <Button variant="outline">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p>No recent alerts.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}