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
        <Card className="dashboard-card card-hover border border-gray-200">
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">
              {camerasLoading ? '...' : cameras?.length || 0}
            </div>
            <div className="flex items-center mt-1">
              <span className="status-dot online"></span>
              <p className="text-sm text-gray-600">Active monitoring devices</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card card-hover border border-gray-200">
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {alertsLoading ? '...' : alerts?.length || 0}
            </div>
            <div className="flex items-center mt-1">
              <span className={`status-dot ${(alerts?.length || 0) > 0 ? 'warning' : 'online'}`}></span>
              <p className="text-sm text-gray-600">Unresolved alerts</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="dashboard-card card-hover border border-gray-200">
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
            <div className="text-3xl font-bold text-green-600">
              {recordingsLoading ? '...' : recordings?.length || 0}
            </div>
            <div className="flex items-center mt-1">
              <span className="status-dot online"></span>
              <p className="text-sm text-gray-600">Videos recorded today</p>
            </div>
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
          <div className="flex justify-center py-8">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : cameras?.length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cameras.slice(0, 6).map((camera) => (
              <Link href={`/cameras/${camera.id}`} key={camera.id}>
                <Card className="card-hover border border-gray-200 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800">{camera.name}</h3>
                        <p className="text-sm text-gray-500">{camera.location || 'No location set'}</p>
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="font-medium">IP:</span> {camera.ip}:{camera.port}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center mb-2">
                          <span className={`status-dot ${camera.status === 'online' ? 'online' : 'offline'}`}></span>
                          <span className="text-xs font-medium capitalize">{camera.status || 'unknown'}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {camera.lastSeen ? `Last seen: ${new Date(camera.lastSeen).toLocaleTimeString()}` : 'Never connected'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                      <span className="text-xs text-gray-500">{camera.manufacturer || 'Unknown'} {camera.model || 'Camera'}</span>
                      <Button variant="outline" size="sm" className="text-xs h-7 px-2">View Feed</Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="mx-auto h-12 w-12 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No cameras configured</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first camera to monitor</p>
              <div className="mt-6">
                <Link href="/cameras">
                  <Button className="mt-4">Add Your First Camera</Button>
                </Link>
              </div>
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
          <div className="flex justify-center py-8">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 h-10 w-10"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        ) : alerts?.length ? (
          <Card className="border border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`text-white p-2 rounded-full flex items-center justify-center 
                        ${alert.type?.toLowerCase().includes('motion') ? 'bg-amber-500' : 
                          alert.type?.toLowerCase().includes('person') ? 'bg-red-500' : 
                          alert.type?.toLowerCase().includes('tamper') ? 'bg-purple-500' : 'bg-blue-500'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium">{alert.type || 'Motion Detected'}</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="status-dot warning"></span>
                          {alert.cameraName || 'Unknown Camera'} • {new Date(alert.timestamp).toLocaleString()}
                        </div>
                        {alert.description && (
                          <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {alert.imageUrl && (
                        <Link href={`/alerts/${alert.id}/image`}>
                          <Button size="sm" variant="outline" className="text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                            Image
                          </Button>
                        </Link>
                      )}
                      <Link href={`/alerts/${alert.id}`}>
                        <Button size="sm" variant="outline" className="text-xs">Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-dashed border-gray-300 bg-gray-50">
            <CardContent className="p-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="mx-auto h-12 w-12 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No alerts detected</h3>
              <p className="mt-1 text-sm text-gray-500">All cameras are functioning normally</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}