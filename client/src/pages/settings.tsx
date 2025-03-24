import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Settings as SettingsType } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  Video, 
  HardDrive, 
  Bell, 
  UserCog, 
  Network, 
  Check, 
  Trash2,
  RotateCw
} from "lucide-react";

// Define the schema for the general settings form
const generalSettingsSchema = z.object({
  motionSensitivity: z.number().min(0).max(100),
  storageLimit: z.number().min(1),
  retentionDays: z.number().min(1).max(365),
  autoDelete: z.boolean(),
});

// Define the schema for the camera settings form
const cameraSettingsSchema = z.object({
  name: z.string().min(1, "Camera name is required"),
  streamUrl: z.string().url("Please enter a valid URL"),
  motionDetection: z.boolean(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;
type CameraSettingsFormValues = z.infer<typeof cameraSettingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);

  // Fetch system settings
  const { 
    data: settings, 
    isLoading: isLoadingSettings 
  } = useQuery<SettingsType>({
    queryKey: ['/api/settings'],
  });

  // Fetch cameras
  const { 
    data: cameras = [], 
    isLoading: isLoadingCameras 
  } = useQuery<Camera[]>({
    queryKey: ['/api/cameras'],
  });

  // Get selected camera
  const selectedCameraData = selectedCamera 
    ? cameras.find(cam => cam.id === selectedCamera) 
    : null;

  // Form for general settings
  const generalForm = useForm<GeneralSettingsFormValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      motionSensitivity: settings?.motionSensitivity || 50,
      storageLimit: settings?.storageLimit || 2048,
      retentionDays: settings?.retentionDays || 30,
      autoDelete: settings?.autoDelete || true,
    },
  });

  // Update form values when settings are loaded
  React.useEffect(() => {
    if (settings) {
      generalForm.reset({
        motionSensitivity: settings.motionSensitivity,
        storageLimit: settings.storageLimit,
        retentionDays: settings.retentionDays,
        autoDelete: settings.autoDelete,
      });
    }
  }, [settings, generalForm]);

  // Form for camera settings
  const cameraForm = useForm<CameraSettingsFormValues>({
    resolver: zodResolver(cameraSettingsSchema),
    defaultValues: {
      name: "",
      streamUrl: "",
      motionDetection: true,
    },
  });

  // Update camera form when selected camera changes
  React.useEffect(() => {
    if (selectedCameraData) {
      cameraForm.reset({
        name: selectedCameraData.name,
        streamUrl: selectedCameraData.streamUrl,
        motionDetection: selectedCameraData.motionDetection,
      });
    }
  }, [selectedCameraData, cameraForm]);

  // Mutation for updating general settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: GeneralSettingsFormValues) => {
      return apiRequest('PUT', '/api/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings Updated",
        description: "Your system settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update settings: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for updating camera settings
  const updateCameraMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CameraSettingsFormValues }) => {
      return apiRequest('PUT', `/api/cameras/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      toast({
        title: "Camera Updated",
        description: "Camera settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update camera: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting a camera
  const deleteCameraMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/cameras/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      setSelectedCamera(null);
      toast({
        title: "Camera Deleted",
        description: "Camera has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete camera: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Handle general settings form submission
  const onGeneralSubmit = (data: GeneralSettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  // Handle camera settings form submission
  const onCameraSubmit = (data: CameraSettingsFormValues) => {
    if (selectedCamera) {
      updateCameraMutation.mutate({ id: selectedCamera, data });
    }
  };

  // Handle camera deletion
  const handleDeleteCamera = () => {
    if (selectedCamera && confirm("Are you sure you want to delete this camera?")) {
      deleteCameraMutation.mutate(selectedCamera);
    }
  };

  // Handle camera reconnection
  const handleReconnectCamera = () => {
    toast({
      title: "Reconnecting",
      description: "Attempting to reconnect to the camera...",
    });
    // In a real implementation, this would reconnect to the camera
  };

  // Loading state
  if (isLoadingSettings && activeTab === "general") {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary-50 p-6">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
          <p className="text-secondary-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-secondary-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row mb-8">
          <div className="w-full md:w-64 mb-6 md:mb-0 md:mr-8">
            <h1 className="text-2xl font-bold text-secondary-900 mb-6">Settings</h1>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <Tabs 
                orientation="vertical" 
                defaultValue="general" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="h-full space-y-6"
              >
                <TabsList className="flex flex-col h-auto bg-transparent space-y-1">
                  <TabsTrigger 
                    value="general" 
                    className="justify-start py-2 px-3 h-auto data-[state=active]:bg-secondary-100"
                  >
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger 
                    value="cameras" 
                    className="justify-start py-2 px-3 h-auto data-[state=active]:bg-secondary-100"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Cameras
                  </TabsTrigger>
                  <TabsTrigger 
                    value="storage" 
                    className="justify-start py-2 px-3 h-auto data-[state=active]:bg-secondary-100"
                  >
                    <HardDrive className="mr-2 h-4 w-4" />
                    Storage
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="justify-start py-2 px-3 h-auto data-[state=active]:bg-secondary-100"
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger 
                    value="network" 
                    className="justify-start py-2 px-3 h-auto data-[state=active]:bg-secondary-100"
                  >
                    <Network className="mr-2 h-4 w-4" />
                    Network
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users" 
                    className="justify-start py-2 px-3 h-auto data-[state=active]:bg-secondary-100"
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    Users
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex-1">
            <TabsContent value="general" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure the basic settings for your surveillance system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...generalForm}>
                    <form id="general-settings-form" onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-6">
                      <FormField
                        control={generalForm.control}
                        name="motionSensitivity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Motion Detection Sensitivity</FormLabel>
                            <FormControl>
                              <div className="space-y-3">
                                <Slider
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={[field.value]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                />
                                <div className="flex justify-between">
                                  <span className="text-xs text-secondary-500">Low</span>
                                  <span className="text-xs text-secondary-900 font-medium">{field.value}%</span>
                                  <span className="text-xs text-secondary-500">High</span>
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Higher sensitivity will detect smaller movements.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="storageLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Limit (GB)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum storage space for recordings in GB.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="retentionDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Retention Period (Days)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormDescription>
                              Number of days to keep recordings before automatic deletion.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalForm.control}
                        name="autoDelete"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">
                                Auto-Delete Recordings
                              </FormLabel>
                              <FormDescription>
                                Automatically delete old recordings after retention period.
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Reset to Defaults</Button>
                  <Button 
                    type="submit" 
                    form="general-settings-form"
                    disabled={updateSettingsMutation.isPending || !generalForm.formState.isDirty}
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="cameras" className="m-0">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Camera Settings</CardTitle>
                  <CardDescription>
                    Configure and manage your connected cameras.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {isLoadingCameras ? (
                      <div className="col-span-full text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                        <p className="text-secondary-500">Loading cameras...</p>
                      </div>
                    ) : cameras.length > 0 ? (
                      cameras.map(camera => (
                        <div
                          key={camera.id}
                          className={`border rounded-lg p-4 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors ${
                            selectedCamera === camera.id ? 'border-primary-300 bg-primary-50' : ''
                          }`}
                          onClick={() => setSelectedCamera(camera.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                camera.status === 'online' 
                                  ? 'bg-success' 
                                  : camera.status === 'warning' 
                                    ? 'bg-warning' 
                                    : 'bg-inactive'
                              }`}></div>
                              <h3 className="font-medium">{camera.name}</h3>
                            </div>
                            {selectedCamera === camera.id && (
                              <Check className="h-4 w-4 text-primary-600" />
                            )}
                          </div>
                          <p className="text-xs text-secondary-500 mt-1 truncate">
                            {camera.streamUrl}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-secondary-500">
                        No cameras found. Add a camera to get started.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setSelectedCamera(null)}>
                      Add New Camera
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {selectedCamera !== null && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedCameraData ? `Edit ${selectedCameraData.name}` : "Add New Camera"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...cameraForm}>
                      <form id="camera-settings-form" onSubmit={cameraForm.handleSubmit(onCameraSubmit)} className="space-y-6">
                        <FormField
                          control={cameraForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Camera Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={cameraForm.control}
                          name="streamUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stream URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="rtsp://example.com/stream" />
                              </FormControl>
                              <FormDescription>
                                RTSP, HTTP, or other supported streaming URL.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={cameraForm.control}
                          name="motionDetection"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                  Motion Detection
                                </FormLabel>
                                <FormDescription>
                                  Enable motion detection for this camera.
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex flex-col sm:flex-row gap-2">
                    <div className="flex space-x-2 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        onClick={handleReconnectCamera}
                        disabled={!selectedCameraData}
                      >
                        <RotateCw className="mr-2 h-4 w-4" />
                        Reconnect
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteCamera}
                        disabled={!selectedCameraData}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                    <div className="ml-auto">
                      <Button 
                        type="submit" 
                        form="camera-settings-form"
                        disabled={updateCameraMutation.isPending || !cameraForm.formState.isDirty}
                      >
                        {updateCameraMutation.isPending ? "Saving..." : "Save Camera"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="storage" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Storage Management</CardTitle>
                  <CardDescription>
                    Monitor and manage your recording storage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-4">Storage Overview</h3>
                    <div className="bg-secondary-100 p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span>Used Space:</span>
                        <span className="font-medium">1.2TB / 2TB</span>
                      </div>
                      <div className="w-full bg-secondary-300 rounded-full h-2 mb-4">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-white p-3 rounded border">
                          <div className="text-secondary-500 mb-1">Recordings</div>
                          <div className="font-medium">1.0TB</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-secondary-500 mb-1">Free Space</div>
                          <div className="font-medium">0.8TB</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                          <div className="text-secondary-500 mb-1">Retention</div>
                          <div className="font-medium">30 Days</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Storage Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline">Clean Old Recordings</Button>
                      <Button variant="outline">Export Configuration</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how and when you receive alerts.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="text-base font-medium">
                          Motion Detection Alerts
                        </div>
                        <div className="text-sm text-secondary-500">
                          Get notified when motion is detected by a camera.
                        </div>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="text-base font-medium">
                          Camera Connection Issues
                        </div>
                        <div className="text-sm text-secondary-500">
                          Get notified when a camera goes offline.
                        </div>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="text-base font-medium">
                          Storage Alerts
                        </div>
                        <div className="text-sm text-secondary-500">
                          Get notified when storage is running low.
                        </div>
                      </div>
                      <Switch defaultChecked={true} />
                    </div>
                    
                    <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <div className="text-base font-medium">
                          System Updates
                        </div>
                        <div className="text-sm text-secondary-500">
                          Get notified about system updates and maintenance.
                        </div>
                      </div>
                      <Switch defaultChecked={false} />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">Save Notification Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Network Settings</CardTitle>
                  <CardDescription>
                    Configure network and connectivity options.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Network Status</h3>
                      <div className="bg-secondary-100 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="bg-white p-3 rounded border">
                            <div className="text-secondary-500 mb-1">Current Bandwidth</div>
                            <div className="font-medium">5.8 Mbps</div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-secondary-500 mb-1">Peak Bandwidth</div>
                            <div className="font-medium">12.3 Mbps</div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-secondary-500 mb-1">Connection Status</div>
                            <div className="font-medium text-success flex items-center">
                              <div className="w-2 h-2 bg-success rounded-full mr-2"></div>
                              Online
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-secondary-500 mb-1">IP Address</div>
                            <div className="font-medium">192.168.1.100</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Bandwidth Control</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Maximum Bandwidth</label>
                          <Select defaultValue="unlimited">
                            <SelectTrigger>
                              <SelectValue placeholder="Select bandwidth limit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unlimited">Unlimited</SelectItem>
                              <SelectItem value="20mbps">20 Mbps</SelectItem>
                              <SelectItem value="10mbps">10 Mbps</SelectItem>
                              <SelectItem value="5mbps">5 Mbps</SelectItem>
                              <SelectItem value="2mbps">2 Mbps</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <div className="text-base font-medium">
                              Adapt Video Quality
                            </div>
                            <div className="text-sm text-secondary-500">
                              Automatically adjust quality based on bandwidth.
                            </div>
                          </div>
                          <Switch defaultChecked={true} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="ml-auto">Save Network Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Manage users and access permissions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <Button>Add New User</Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium mr-3">
                          A
                        </div>
                        <div>
                          <div className="font-medium">Admin User</div>
                          <div className="text-sm text-secondary-500">admin@example.com</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded mr-3">
                          Administrator
                        </span>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-700 font-medium mr-3">
                          V
                        </div>
                        <div>
                          <div className="font-medium">Viewer Account</div>
                          <div className="text-sm text-secondary-500">viewer@example.com</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="bg-secondary-100 text-secondary-700 text-xs px-2 py-1 rounded mr-3">
                          Viewer
                        </span>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </div>
    </div>
  );
}

// Import for MoreHorizontal icon
import { MoreHorizontal } from "lucide-react";
import React from "react";
