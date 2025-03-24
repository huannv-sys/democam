import * as React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';
import { toast } from '../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { z } from 'zod';

const settingsFormSchema = z.object({
  motionDetectionEnabled: z.boolean().default(true),
  motionSensitivity: z.number().min(1).max(10).default(5),
  recordOnMotion: z.boolean().default(true),
  recordingDuration: z.number().min(5).max(300).default(30),
  alertOnMotion: z.boolean().default(true),
  saveSnapshots: z.boolean().default(true),
  storageLimit: z.number().min(1).max(1000).default(100),
  autoDeleteOldRecordings: z.boolean().default(true),
  retentionDays: z.number().min(1).max(365).default(30),
  emailNotifications: z.boolean().default(false),
  emailAddress: z.string().email().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>

export default function SettingsPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiRequest('/api/settings'),
  });

  const [formValues, setFormValues] = React.useState<SettingsFormValues>({
    motionDetectionEnabled: true,
    motionSensitivity: 5,
    recordOnMotion: true,
    recordingDuration: 30,
    alertOnMotion: true,
    saveSnapshots: true,
    storageLimit: 100,
    autoDeleteOldRecordings: true,
    retentionDays: 30,
    emailNotifications: false,
    emailAddress: '',
  });

  React.useEffect(() => {
    if (settings) {
      setFormValues(settings);
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: SettingsFormValues) => 
      apiRequest('/api/settings', { 
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  });

  const onSubmit = (data: SettingsFormValues) => {
    updateSettingsMutation.mutate(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = settingsFormSchema.parse(formValues);
      onSubmit(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: errorMessage,
        });
      }
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Settings</h1>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="space-y-6">
          {/* Motion Detection Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Motion Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="motionDetectionEnabled" className="font-medium">
                    Enable Motion Detection
                  </label>
                  <p className="text-sm text-gray-500">
                    Detect movement in camera feeds and trigger actions
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="motionDetectionEnabled"
                  name="motionDetectionEnabled"
                  checked={formValues.motionDetectionEnabled}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="motionSensitivity" className="font-medium">
                  Motion Sensitivity: {formValues.motionSensitivity}
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  How sensitive the motion detection should be (1-10)
                </p>
                <input
                  type="range"
                  id="motionSensitivity"
                  name="motionSensitivity"
                  min="1"
                  max="10"
                  step="1"
                  value={formValues.motionSensitivity}
                  onChange={handleInputChange}
                  className="w-full"
                  disabled={!formValues.motionDetectionEnabled}
                />
                <div className="flex justify-between text-xs">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="recordOnMotion" className="font-medium">
                    Record on Motion
                  </label>
                  <p className="text-sm text-gray-500">
                    Automatically start recording when motion is detected
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="recordOnMotion"
                  name="recordOnMotion"
                  checked={formValues.recordOnMotion}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-gray-300"
                  disabled={!formValues.motionDetectionEnabled}
                />
              </div>

              <div>
                <label htmlFor="recordingDuration" className="font-medium">
                  Recording Duration (seconds)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  How long to record after motion is detected
                </p>
                <input
                  type="number"
                  id="recordingDuration"
                  name="recordingDuration"
                  min="5"
                  max="300"
                  value={formValues.recordingDuration}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  disabled={!formValues.motionDetectionEnabled || !formValues.recordOnMotion}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="alertOnMotion" className="font-medium">
                    Create Alert on Motion
                  </label>
                  <p className="text-sm text-gray-500">
                    Generate an alert entry when motion is detected
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="alertOnMotion"
                  name="alertOnMotion"
                  checked={formValues.alertOnMotion}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-gray-300"
                  disabled={!formValues.motionDetectionEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="saveSnapshots" className="font-medium">
                    Save Snapshots
                  </label>
                  <p className="text-sm text-gray-500">
                    Save still images when motion is detected
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="saveSnapshots"
                  name="saveSnapshots"
                  checked={formValues.saveSnapshots}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-gray-300"
                  disabled={!formValues.motionDetectionEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Storage Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Storage Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="storageLimit" className="font-medium">
                  Storage Limit (GB)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Maximum storage space for recordings and snapshots
                </p>
                <input
                  type="number"
                  id="storageLimit"
                  name="storageLimit"
                  min="1"
                  max="1000"
                  value={formValues.storageLimit}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="autoDeleteOldRecordings" className="font-medium">
                    Auto-Delete Old Recordings
                  </label>
                  <p className="text-sm text-gray-500">
                    Automatically delete old recordings when storage limit is reached
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="autoDeleteOldRecordings"
                  name="autoDeleteOldRecordings"
                  checked={formValues.autoDeleteOldRecordings}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="retentionDays" className="font-medium">
                  Retention Period (days)
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  How long to keep recordings before auto-deletion
                </p>
                <input
                  type="number"
                  id="retentionDays"
                  name="retentionDays"
                  min="1"
                  max="365"
                  value={formValues.retentionDays}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  disabled={!formValues.autoDeleteOldRecordings}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="emailNotifications" className="font-medium">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Send email notifications when alerts are triggered
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="emailNotifications"
                  name="emailNotifications"
                  checked={formValues.emailNotifications}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>

              <div>
                <label htmlFor="emailAddress" className="font-medium">
                  Email Address
                </label>
                <p className="text-sm text-gray-500 mb-2">
                  Where to send email notifications
                </p>
                <input
                  type="email"
                  id="emailAddress"
                  name="emailAddress"
                  value={formValues.emailAddress || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 p-2 text-sm"
                  disabled={!formValues.emailNotifications}
                  placeholder="your@email.com"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="px-6"
            >
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}