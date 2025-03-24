import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { 
  Card, 
  CardContent
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  Calendar,
  Search,
  Camera as CameraIcon,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCw
} from "lucide-react"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { formatDate } from "@/lib/utils"
import { Alert, Camera } from "../../shared/schema"

export default function Alerts() {
  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  })

  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  })

  const resolveAlert = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/alerts/${id}`, { 
        method: "PATCH", 
        body: JSON.stringify({ resolved: true }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  })

  const unresolveAlert = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/alerts/${id}`, { 
        method: "PATCH", 
        body: JSON.stringify({ resolved: false }) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] })
    }
  })

  const [selectedCamera, setSelectedCamera] = useState<string | "all">("all")
  const [selectedStatus, setSelectedStatus] = useState<"all" | "resolved" | "unresolved">("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredAlerts = alerts.filter(alert => {
    // Filter by camera
    if (selectedCamera !== "all" && alert.cameraId !== selectedCamera) {
      return false
    }
    
    // Filter by status
    if (selectedStatus === "resolved" && !alert.resolved) {
      return false
    }
    if (selectedStatus === "unresolved" && alert.resolved) {
      return false
    }
    
    // Filter by search query
    if (searchQuery) {
      const cameraName = cameras.find(c => c.id === alert.cameraId)?.name || ""
      const query = searchQuery.toLowerCase()
      return (
        alert.type.toLowerCase().includes(query) || 
        cameraName.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  const handleResolveAlert = (id: string) => {
    resolveAlert.mutate(id)
  }

  const handleUnresolveAlert = (id: string) => {
    unresolveAlert.mutate(id)
  }

  const getCameraName = (cameraId: string) => {
    return cameras.find(c => c.id === cameraId)?.name || "Camera không xác định"
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "MOTION_DETECTED":
        return <AlertTriangle className="h-5 w-5" />
      case "CAMERA_OFFLINE":
        return <XCircle className="h-5 w-5" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  const getAlertTypeText = (type: string) => {
    switch (type) {
      case "MOTION_DETECTED":
        return "Phát hiện chuyển động"
      case "CAMERA_OFFLINE":
        return "Camera ngắt kết nối"
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý cảnh báo</h1>
        <p className="text-muted-foreground">Xem và quản lý các cảnh báo từ hệ thống camera</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm cảnh báo..."
            className="w-full pl-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={selectedCamera}
          onChange={(e) => setSelectedCamera(e.target.value)}
        >
          <option value="all">Tất cả camera</option>
          {cameras.map(camera => (
            <option key={camera.id} value={camera.id}>
              {camera.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as "all" | "resolved" | "unresolved")}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="resolved">Đã giải quyết</option>
          <option value="unresolved">Chưa giải quyết</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p>Đang tải dữ liệu cảnh báo...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/20">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Không có cảnh báo</h3>
          <p className="text-muted-foreground mt-2">
            Không tìm thấy cảnh báo nào phù hợp với tìm kiếm của bạn.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
                <div 
                  className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 ${
                    alert.resolved 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">
                      {getAlertTypeText(alert.type)}
                    </h3>
                    <div className={`text-sm px-2 py-1 rounded-full ${
                      alert.resolved 
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {alert.resolved ? "Đã giải quyết" : "Chưa giải quyết"}
                    </div>
                  </div>
                  
                  <p className="text-sm mt-1">{alert.description}</p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-2">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <CameraIcon className="h-3.5 w-3.5 mr-1.5" />
                      <span>{getCameraName(alert.cameraId)}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      <span>{formatDate(alert.timestamp)}</span>
                    </div>
                    
                    <div className="flex gap-2 ml-auto mt-2 sm:mt-0">
                      {alert.resolved ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUnresolveAlert(alert.id)}
                          disabled={unresolveAlert.isPending}
                        >
                          <RotateCw className="h-4 w-4 mr-1" /> Đánh dấu chưa giải quyết
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleResolveAlert(alert.id)}
                          disabled={resolveAlert.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Đánh dấu đã giải quyết
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}