import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from '../hooks/use-toast';
import { formatDate } from '../lib/utils';

interface Alert {
  id: string;
  cameraId: string;
  cameraName?: string;
  type: string;
  timestamp: string;
  imageUrl?: string;
  resolved: boolean;
  description?: string;
}

export default function Alerts() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = React.useState<'all' | 'active' | 'resolved'>('all');

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', filter],
    queryFn: () => {
      if (filter === 'all') {
        return apiRequest('/api/alerts');
      } else {
        const resolved = filter === 'resolved';
        return apiRequest(`/api/alerts?resolved=${resolved}`);
      }
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/alerts/${id}/resolve`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: "Alert Resolved",
        description: "The alert has been marked as resolved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to resolve alert: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  const handleResolveAlert = (id: string) => {
    resolveAlertMutation.mutate(id);
  };

  const getAlertTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'motion':
      case 'motion detected':
        return 'bg-yellow-100 text-yellow-800';
      case 'sound':
      case 'sound detected':
        return 'bg-blue-100 text-blue-800';
      case 'person':
      case 'person detected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Alerts</h1>
        <div className="flex space-x-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'active' ? 'default' : 'outline'} 
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button 
            variant={filter === 'resolved' ? 'default' : 'outline'} 
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading alerts...</div>
      ) : alerts?.length ? (
        <div className="space-y-4">
          {alerts.map((alert: Alert) => (
            <Card key={alert.id}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {alert.imageUrl && (
                    <div className="md:w-1/3 p-4">
                      <div className="aspect-video bg-gray-100 flex items-center justify-center">
                        <div className="text-gray-400">Alert Image</div>
                        {/* In a real app, this would display the captured image */}
                      </div>
                    </div>
                  )}
                  <div className={`flex-1 p-4 ${alert.imageUrl ? 'md:border-l' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getAlertTypeColor(alert.type)}`}>
                          {alert.type}
                        </span>
                        <h3 className="text-lg font-semibold mt-2">
                          Alert from {alert.cameraName || 'Unknown Camera'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        {alert.resolved ? (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            Resolved
                          </span>
                        ) : (
                          <Button 
                            onClick={() => handleResolveAlert(alert.id)}
                            variant="outline"
                          >
                            Mark as Resolved
                          </Button>
                        )}
                      </div>
                    </div>

                    {alert.description && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium">Description</h4>
                        <p className="text-sm mt-1">{alert.description}</p>
                      </div>
                    )}

                    <div className="mt-4">
                      <Button variant="secondary">
                        View Camera
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <p>No alerts found.</p>
            {filter !== 'all' && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setFilter('all')}
              >
                Show All Alerts
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}