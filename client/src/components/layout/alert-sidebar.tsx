import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Settings, Activity, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function AlertSidebar() {
  // Fetch alerts
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
  });

  // Mutation for marking alert as read
  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest('PUT', `/api/alerts/${alertId}`, { isRead: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
    },
  });

  // Handler for dismissing an alert
  const handleDismiss = (alertId: number) => {
    markAsReadMutation.mutate(alertId);
  };

  // Get alert icon based on type
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'motion':
        return <Activity className="h-5 w-5" />;
      case 'connection':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
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

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss');
  };

  return (
    <aside className="w-80 bg-white border-l border-secondary-200 overflow-y-auto flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-secondary-200">
        <h2 className="font-semibold text-secondary-800 flex items-center justify-between">
          <span>Recent Alerts</span>
          <button className="text-secondary-500 hover:text-secondary-700">
            <Settings className="h-4 w-4" />
          </button>
        </h2>
      </div>
      <div>
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <div 
              key={alert.id} 
              className="border-b border-secondary-200 p-4 hover:bg-secondary-50"
            >
              <div className="flex">
                <div className="flex-shrink-0 mr-3">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full ${getAlertColor(alert.type)}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-secondary-800">
                    {alert.message.split(':')[0]}
                  </h3>
                  <p className="text-sm text-secondary-600 mb-2">
                    {alert.message.includes(':') ? alert.message.split(':')[1].trim() : ''}
                  </p>
                  <div className="text-xs text-secondary-500 font-mono">
                    {formatTimestamp(alert.timestamp)}
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs h-7 bg-primary-50 text-primary-700 hover:bg-primary-100 border-primary-200"
                    >
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-7 bg-secondary-100 text-secondary-700 hover:bg-secondary-200 border-secondary-200"
                      onClick={() => handleDismiss(alert.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-secondary-500">
            <Bell className="h-12 w-12 mb-4 opacity-20" />
            <p>No alerts to display</p>
          </div>
        )}
      </div>
    </aside>
  );
}

// Import at top for Bell icon
import { Bell } from "lucide-react";
