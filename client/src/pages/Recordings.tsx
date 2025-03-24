import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { 
  Card, 
  CardContent,
  CardFooter 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Video, 
  Calendar, 
  Play, 
  Download, 
  Trash2, 
  Clock,
  Search,
  Camera as CameraIcon
} from "lucide-react"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { formatDate, formatDuration } from "@/lib/utils"
import { Recording, Camera } from "../../shared/schema"

export default function Recordings() {
  const { data: recordings = [], isLoading } = useQuery<Recording[]>({
    queryKey: ["/api/recordings"],
  })

  const { data: cameras = [] } = useQuery<Camera[]>({
    queryKey: ["/api/cameras"],
  })

  const deleteRecording = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/recordings/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] })
    }
  })

  const [selectedCamera, setSelectedCamera] = useState<string | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  const filteredRecordings = recordings.filter(recording => {
    // Filter by camera
    if (selectedCamera !== "all" && recording.cameraId !== selectedCamera) {
      return false
    }
    
    // Filter by search query
    if (searchQuery) {
      const cameraName = cameras.find(c => c.id === recording.cameraId)?.name || ""
      const query = searchQuery.toLowerCase()
      return (
        recording.name.toLowerCase().includes(query) || 
        cameraName.toLowerCase().includes(query)
      )
    }
    
    return true
  })

  const handleDeleteRecording = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa bản ghi hình này?")) {
      deleteRecording.mutate(id)
    }
  }

  const getCameraName = (cameraId: string) => {
    return cameras.find(c => c.id === cameraId)?.name || "Camera không xác định"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý ghi hình</h1>
        <p className="text-muted-foreground">Xem và quản lý các bản ghi hình từ camera</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm bản ghi..."
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
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p>Đang tải dữ liệu bản ghi hình...</p>
        </div>
      ) : filteredRecordings.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-muted/20">
          <Video className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Không có bản ghi hình</h3>
          <p className="text-muted-foreground mt-2">
            Không tìm thấy bản ghi hình nào phù hợp với tìm kiếm của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecordings.map((recording) => (
            <Card key={recording.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative flex items-center justify-center">
                {/* Video thumbnail */}
                <Video className="h-10 w-10 text-muted-foreground" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(recording.duration)}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium truncate">{recording.name}</h3>
                <div className="flex items-center text-muted-foreground text-sm mt-2">
                  <CameraIcon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="truncate">{getCameraName(recording.cameraId)}</span>
                </div>
                <div className="flex items-center text-muted-foreground text-sm mt-1">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  <span>{formatDate(recording.startTime)}</span>
                </div>
                <div className="flex items-center text-muted-foreground text-sm mt-1">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  <span>
                    {formatDuration(recording.duration)} giây
                  </span>
                </div>
              </CardContent>
              <CardFooter className="grid grid-cols-3 gap-2 p-4 pt-0">
                <Button variant="default" size="sm" className="w-full">
                  <Play className="h-4 w-4 mr-1" /> Xem
                </Button>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-1" /> Tải
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleDeleteRecording(recording.id)}
                  disabled={deleteRecording.isPending}
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