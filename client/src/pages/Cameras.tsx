import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera as CameraIcon, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"
import { Link } from "wouter"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { Camera } from "../../shared/schema"

export default function Cameras() {
  const { data: cameras = [], isLoading } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  })

  const deleteCamera = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/cameras/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cameras"] })
    }
  })

  const [filterStatus, setFilterStatus] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL")
  
  const filteredCameras = cameras.filter(camera => {
    if (filterStatus === "ALL") return true
    return camera.status === filterStatus
  })

  const handleDeleteCamera = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa camera này?")) {
      deleteCamera.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Camera</h1>
          <p className="text-muted-foreground">Quản lý và xem toàn bộ camera trong hệ thống</p>
        </div>
        <Link href="/cameras/new">
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Thêm Camera
          </Button>
        </Link>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filterStatus === "ALL" ? "default" : "outline"}
          onClick={() => setFilterStatus("ALL")}
        >
          Tất cả
        </Button>
        <Button
          variant={filterStatus === "ONLINE" ? "default" : "outline"}
          onClick={() => setFilterStatus("ONLINE")}
        >
          Online
        </Button>
        <Button
          variant={filterStatus === "OFFLINE" ? "default" : "outline"}
          onClick={() => setFilterStatus("OFFLINE")}
        >
          Offline
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p>Đang tải dữ liệu camera...</p>
        </div>
      ) : filteredCameras.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/20">
          <CameraIcon className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Không tìm thấy camera</h3>
          <p className="text-muted-foreground mt-2">
            {filterStatus !== "ALL" 
              ? `Không có camera nào có trạng thái ${filterStatus === "ONLINE" ? "Online" : "Offline"}.` 
              : "Chưa có camera nào trong hệ thống."}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/cameras/new">
              <Plus className="h-4 w-4 mr-2" />
              Thêm Camera
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCameras.map((camera) => (
            <Card key={camera.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0 relative">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {/* Camera thumbnail/preview */}
                  <Link href={`/cameras/${camera.id}`}>
                    <a className="absolute inset-0 flex items-center justify-center">
                      <CameraIcon className="h-12 w-12 text-muted-foreground" />
                    </a>
                  </Link>
                  <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full flex items-center ${
                    camera.status === "ONLINE"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {camera.status === "ONLINE" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Online
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Offline
                      </>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <Link href={`/cameras/${camera.id}`}>
                    <a>
                      <h3 className="font-medium text-lg mb-1">{camera.name}</h3>
                    </a>
                  </Link>
                  <p className="text-muted-foreground text-sm">{camera.location}</p>
                  <p className="text-muted-foreground text-xs mt-1">IP: {camera.ipAddress}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4 pt-0">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/cameras/${camera.id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" /> Sửa
                  </Link>
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteCamera(camera.id)}
                  disabled={deleteCamera.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Xóa
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}