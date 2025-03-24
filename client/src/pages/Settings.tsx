import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation } from "@tanstack/react-query"
import { z } from "zod"
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, Loader2 } from "lucide-react"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { toast } from "@/hooks/use-toast"
import { Settings } from "../../shared/schema"

// Extended form schema with validation
const settingsFormSchema = z.object({
  storageLocation: z.string().min(1, "Vui lòng nhập vị trí lưu trữ"),
  maxStorageSize: z.coerce.number().min(1, "Kích thước tối thiểu là 1GB"),
  retentionPeriod: z.coerce.number().min(1, "Thời gian tối thiểu là 1 ngày"),
  defaultMotionSensitivity: z.coerce.number().min(1).max(10, "Chọn giá trị từ 1-10"),
  recordingFormat: z.enum(["MP4", "WEBM"]),
  maxConcurrentStreams: z.coerce.number().min(1, "Tối thiểu 1 luồng"),
  notificationsEnabled: z.boolean()
})

type SettingsFormValues = z.infer<typeof settingsFormSchema>

export default function SettingsPage() {
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  })

  const updateSettings = useMutation({
    mutationFn: (data: SettingsFormValues) => 
      apiRequest("/api/settings", { 
        method: "PUT", 
        body: JSON.stringify(data) 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] })
      toast({
        title: "Lưu thành công",
        description: "Cài đặt đã được cập nhật",
      })
    },
    onError: (error) => {
      toast({
        title: "Lỗi",
        description: `Không thể cập nhật cài đặt: ${error.message}`,
        variant: "destructive",
      })
    }
  })

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      storageLocation: "",
      maxStorageSize: 10,
      retentionPeriod: 30,
      defaultMotionSensitivity: 5,
      recordingFormat: "MP4",
      maxConcurrentStreams: 5,
      notificationsEnabled: true
    }
  })

  // Update form values when settings are loaded
  React.useEffect(() => {
    if (settings) {
      form.reset(settings)
    }
  }, [settings, form])

  const onSubmit = (data: SettingsFormValues) => {
    updateSettings.mutate(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground">Tùy chỉnh cài đặt cho hệ thống giám sát camera</p>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <p>Đang tải dữ liệu cài đặt...</p>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt lưu trữ</CardTitle>
              <CardDescription>
                Tùy chỉnh cách hệ thống lưu trữ bản ghi video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="storageLocation" className="text-sm font-medium">
                    Vị trí lưu trữ
                  </label>
                  <input
                    id="storageLocation"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="/path/to/storage"
                    {...form.register("storageLocation")}
                  />
                  {form.formState.errors.storageLocation && (
                    <p className="text-sm text-red-500">{form.formState.errors.storageLocation.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="maxStorageSize" className="text-sm font-medium">
                    Dung lượng tối đa (GB)
                  </label>
                  <input
                    id="maxStorageSize"
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    {...form.register("maxStorageSize")}
                  />
                  {form.formState.errors.maxStorageSize && (
                    <p className="text-sm text-red-500">{form.formState.errors.maxStorageSize.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="retentionPeriod" className="text-sm font-medium">
                    Thời gian lưu trữ (ngày)
                  </label>
                  <input
                    id="retentionPeriod"
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    {...form.register("retentionPeriod")}
                  />
                  {form.formState.errors.retentionPeriod && (
                    <p className="text-sm text-red-500">{form.formState.errors.retentionPeriod.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="recordingFormat" className="text-sm font-medium">
                    Định dạng ghi hình
                  </label>
                  <select
                    id="recordingFormat"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    {...form.register("recordingFormat")}
                  >
                    <option value="MP4">MP4</option>
                    <option value="WEBM">WEBM</option>
                  </select>
                  {form.formState.errors.recordingFormat && (
                    <p className="text-sm text-red-500">{form.formState.errors.recordingFormat.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt camera</CardTitle>
              <CardDescription>
                Tùy chỉnh cài đặt mặc định cho tất cả camera
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="defaultMotionSensitivity" className="text-sm font-medium">
                    Độ nhạy phát hiện chuyển động (1-10)
                  </label>
                  <input
                    id="defaultMotionSensitivity"
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    min="1"
                    max="10"
                    {...form.register("defaultMotionSensitivity")}
                  />
                  {form.formState.errors.defaultMotionSensitivity && (
                    <p className="text-sm text-red-500">{form.formState.errors.defaultMotionSensitivity.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="maxConcurrentStreams" className="text-sm font-medium">
                    Số luồng xem song song tối đa
                  </label>
                  <input
                    id="maxConcurrentStreams"
                    type="number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    {...form.register("maxConcurrentStreams")}
                  />
                  {form.formState.errors.maxConcurrentStreams && (
                    <p className="text-sm text-red-500">{form.formState.errors.maxConcurrentStreams.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Thông báo</CardTitle>
              <CardDescription>
                Cài đặt thông báo khi phát hiện sự kiện
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  id="notificationsEnabled"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  {...form.register("notificationsEnabled")}
                />
                <label htmlFor="notificationsEnabled" className="text-sm font-medium">
                  Bật thông báo khi phát hiện sự cố
                </label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="ml-auto"
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu thay đổi
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  )
}