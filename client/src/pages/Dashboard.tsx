import { useQuery } from "@tanstack/react-query"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription 
} from "@/components/ui/card"
import { Camera, Video, Bell, CheckCircle } from "lucide-react"
import { Link } from "wouter"
import { Camera as CameraType } from "../../shared/schema"

export default function Dashboard() {
  const { data: cameras = [], isLoading: camerasLoading } = useQuery<CameraType[]>({
    queryKey: ["/api/cameras"],
  })

  const { data: recordings = [], isLoading: recordingsLoading } = useQuery({
    queryKey: ["/api/recordings"],
  })

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ["/api/alerts"],
  })

  // Đếm số cảnh báo chưa xử lý
  const unresolvedAlerts = alertsLoading 
    ? 0 
    : alerts.filter((alert) => !alert.resolved).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trang chủ</h1>
        <p className="text-muted-foreground">Tổng quan hệ thống giám sát camera</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/cameras">
          <a className="block h-full">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Cameras</CardTitle>
                <Camera className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {camerasLoading ? "..." : cameras.length}
                </div>
                <p className="text-muted-foreground">
                  {camerasLoading 
                    ? "Đang tải..." 
                    : cameras.filter(c => c.status === "ONLINE").length + " camera đang hoạt động"}
                </p>
              </CardContent>
            </Card>
          </a>
        </Link>

        <Link href="/recordings">
          <a className="block h-full">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Ghi hình</CardTitle>
                <Video className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {recordingsLoading ? "..." : recordings.length}
                </div>
                <p className="text-muted-foreground">
                  {recordingsLoading ? "Đang tải..." : "Bản ghi hình"}
                </p>
              </CardContent>
            </Card>
          </a>
        </Link>

        <Link href="/alerts">
          <a className="block h-full">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">Cảnh báo</CardTitle>
                <Bell className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {alertsLoading ? "..." : unresolvedAlerts}
                </div>
                <p className="text-muted-foreground">
                  {alertsLoading ? "Đang tải..." : "Cảnh báo chưa giải quyết"}
                </p>
              </CardContent>
            </Card>
          </a>
        </Link>
      </div>

      {/* Recent Cameras */}
      <div>
        <h2 className="text-xl font-bold mb-4">Camera đang hoạt động</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {camerasLoading ? (
            <p>Đang tải dữ liệu camera...</p>
          ) : cameras.length === 0 ? (
            <p>Chưa có camera nào được thêm vào hệ thống.</p>
          ) : (
            cameras.slice(0, 6).map((camera) => (
              <Link key={camera.id} href={`/cameras/${camera.id}`}>
                <a className="block">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="aspect-video bg-muted relative flex items-center justify-center">
                        {/* Camera thumbnail placeholder */}
                        <div className="text-muted-foreground">
                          {camera.status === "ONLINE" ? (
                            <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Online
                            </div>
                          ) : (
                            <div className="absolute top-2 right-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              Offline
                            </div>
                          )}
                          <Camera className="h-12 w-12" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium truncate">{camera.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{camera.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Recent Alerts */}
      <div>
        <h2 className="text-xl font-bold mb-4">Cảnh báo gần đây</h2>
        <Card>
          <CardContent className="p-0">
            {alertsLoading ? (
              <p className="p-4">Đang tải cảnh báo...</p>
            ) : alerts.length === 0 ? (
              <p className="p-4">Không có cảnh báo nào gần đây.</p>
            ) : (
              <div className="divide-y">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-4 flex items-center gap-4">
                    <div 
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        alert.resolved 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.type} - Camera {
                        cameras.find(c => c.id === alert.cameraId)?.name || alert.cameraId
                      }</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className={`text-sm px-2 py-1 rounded-full ${
                      alert.resolved 
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {alert.resolved ? "Đã giải quyết" : "Chưa giải quyết"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}