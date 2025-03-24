import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Alert, Camera } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Bell, 
  AlertTriangle, 
  Activity, 
  Filter, 
  CheckCircle, 
  ChevronDown, 
  MoreHorizontal,
  Calendar,
  Video
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Alerts() {
  const [filter, setFilter] = useState<"all" | "unread" | "motion" | "connection">("all");
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);

  // Fetch alerts
  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
  });

  // Fetch cameras for filter
  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ['/api/cameras'],
  });

  // Mark alert as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest('PUT', `/api/alerts/${alertId}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  // Delete alert mutation
  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest('DELETE', `/api/alerts/${alertId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  // Filter alerts based on current filter
  const filteredAlerts = alerts.filter(alert => {
    // Filter by read/unread status
    if (filter === "unread" && alert.isRead) return false;
    
    // Filter by alert type
    if (filter === "motion" && alert.type !== "motion") return false;
    if (filter === "connection" && alert.type !== "connection") return false;
    
    // Filter by camera
    if (selectedCamera && alert.cameraId !== selectedCamera) return false;
    
    return true;
  });

  // Get alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'motion':
        return <Activity className="h-5 w-5" />;
      case 'connection':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Get alert color based on type
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'motion':
        return 'text-danger bg-danger/10';
      case 'connection':
        return 'text-amber-500 bg-amber-500/10';
      default:
        return 'text-primary-500 bg-primary-500/10';
    }
  };

  // Handle marking all as read
  const handleMarkAllAsRead = async () => {
    // In a real app, this would be a single API call
    // For this demo, we'll mark each unread alert as read
    const unreadAlerts = alerts.filter(alert => !alert.isRead);
    for (const alert of unreadAlerts) {
      await markAsReadMutation.mutateAsync(alert.id);
    }
  };

  // Handle mark as read
  const handleMarkAsRead = (alertId: number) => {
    markAsReadMutation.mutate(alertId);
  };

  // Handle delete
  const handleDelete = (alertId: number) => {
    deleteAlertMutation.mutate(alertId);
  };

  // Get camera name by ID
  const getCameraName = (cameraId: number) => {
    const camera = cameras.find(c => c.id === cameraId);
    return camera ? camera.name : `Camera ${cameraId}`;
  };

  return (
    <div className="flex-1 overflow-auto p-6 bg-secondary-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">Alerts</h1>
            <p className="text-secondary-500 mt-1">
              View and manage system alerts and notifications
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleMarkAllAsRead}
              disabled={!alerts.some(alert => !alert.isRead)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
            <Button>
              <Bell className="mr-2 h-4 w-4" />
              Alert Settings
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-wrap gap-3">
            <Tabs defaultValue="all" value={filter} onValueChange={(value) => setFilter(value as any)}>
              <TabsList>
                <TabsTrigger value="all">All Alerts</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
                <TabsTrigger value="motion">Motion</TabsTrigger>
                <TabsTrigger value="connection">Connection</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="ml-auto flex space-x-2">
              <div className="flex items-center bg-secondary-100 rounded-lg px-3 py-1.5">
                <Calendar className="w-4 h-4 mr-2 text-secondary-500" />
                <Select defaultValue="today">
                  <SelectTrigger className="border-0 bg-transparent h-7 min-w-[120px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="yesterday">Yesterday</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center bg-secondary-100 rounded-lg px-3 py-1.5">
                <Video className="w-4 h-4 mr-2 text-secondary-500" />
                <Select 
                  value={selectedCamera ? selectedCamera.toString() : "all"}
                  onValueChange={(value) => setSelectedCamera(value === "all" ? null : parseInt(value))}
                >
                  <SelectTrigger className="border-0 bg-transparent h-7 min-w-[120px]">
                    <SelectValue placeholder="All Cameras" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cameras</SelectItem>
                    {cameras.map((camera) => (
                      <SelectItem key={camera.id} value={camera.id.toString()}>
                        {camera.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
              <p className="text-secondary-500">Loading alerts...</p>
            </div>
          ) : filteredAlerts.length > 0 ? (
            <div>
              {filteredAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`border-b border-secondary-200 p-4 hover:bg-secondary-50 ${!alert.isRead ? 'bg-secondary-50' : ''}`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full ${getAlertColor(alert.type)}`}>
                        {getAlertIcon(alert.type)}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-secondary-900">
                            {alert.message.split(':')[0]}
                          </h3>
                          <p className="text-sm text-secondary-600">
                            {getCameraName(alert.cameraId)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-secondary-500">
                            {format(new Date(alert.timestamp), 'MMM d, h:mm a')}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 hover:bg-secondary-100 rounded">
                                <MoreHorizontal className="h-4 w-4 text-secondary-500" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!alert.isRead && (
                                <DropdownMenuItem onClick={() => handleMarkAsRead(alert.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDelete(alert.id)}>
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs h-7 bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200"
                        >
                          View
                        </Button>
                        {!alert.isRead && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs h-7 bg-secondary-100 text-secondary-700 hover:bg-secondary-200 border-secondary-200"
                            onClick={() => handleMarkAsRead(alert.id)}
                          >
                            Dismiss
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-secondary-500">
              <Bell className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="text-lg font-semibold text-secondary-900">No Alerts Found</h3>
              <p className="mt-2 max-w-md">
                There are no alerts matching your current filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Import for trash icon
import { Trash } from "lucide-react";
