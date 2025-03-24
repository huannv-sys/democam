import { Camera, Recording, Alert, Settings, InsertCamera, InsertRecording, InsertAlert, InsertSettings } from '../shared/schema';
import { v4 as uuidv4 } from 'uuid';

// Interface for storage operations
export interface IStorage {
  // Camera operations
  getCameras(): Promise<Camera[]>;
  getCameraById(id: string): Promise<Camera | null>;
  createCamera(data: InsertCamera): Promise<Camera>;
  updateCamera(id: string, data: Partial<Camera>): Promise<Camera | null>;
  deleteCamera(id: string): Promise<boolean>;

  // Recording operations
  getRecordings(filters?: { cameraId?: string, startDate?: Date, endDate?: Date }): Promise<Recording[]>;
  getRecordingById(id: string): Promise<Recording | null>;
  createRecording(data: InsertRecording): Promise<Recording>;
  updateRecording(id: string, data: Partial<Recording>): Promise<Recording | null>;
  deleteRecording(id: string): Promise<boolean>;

  // Alert operations
  getAlerts(filters?: { cameraId?: string, resolved?: boolean, startDate?: Date, endDate?: Date }): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | null>;
  createAlert(data: InsertAlert): Promise<Alert>;
  updateAlert(id: string, data: Partial<Alert>): Promise<Alert | null>;
  deleteAlert(id: string): Promise<boolean>;

  // Settings operations
  getSettings(): Promise<Settings>;
  updateSettings(data: InsertSettings): Promise<Settings>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private cameras: Camera[] = [];
  private recordings: Recording[] = [];
  private alerts: Alert[] = [];
  private settings: Settings;

  constructor() {
    // Initialize with default settings
    this.settings = {
      id: 'settings',
      storageLocation: './recordings',
      maxStorageSize: 10 * 1024 * 1024 * 1024, // 10 GB
      retentionPeriod: 30, // days
      defaultMotionSensitivity: 50,
      recordingFormat: 'MP4',
      maxConcurrentStreams: 4,
      notificationsEnabled: true,
    };

    // Add some demo cameras
    this.cameras = [
      {
        id: uuidv4(),
        name: 'Front Door',
        url: 'https://demo.camera.stream/front-door',
        enabled: true,
        motionDetection: true,
        motionSensitivity: 60,
        recordOnMotion: true,
      },
      {
        id: uuidv4(),
        name: 'Backyard',
        url: 'https://demo.camera.stream/backyard',
        enabled: true,
        motionDetection: true,
        motionSensitivity: 50,
        recordOnMotion: true,
      },
      {
        id: uuidv4(),
        name: 'Garage',
        url: 'https://demo.camera.stream/garage',
        enabled: true,
        motionDetection: true,
        motionSensitivity: 40,
        recordOnMotion: true,
      },
    ];
  }

  // Camera operations
  async getCameras(): Promise<Camera[]> {
    return this.cameras;
  }

  async getCameraById(id: string): Promise<Camera | null> {
    return this.cameras.find(camera => camera.id === id) || null;
  }

  async createCamera(data: InsertCamera): Promise<Camera> {
    const newCamera: Camera = {
      id: uuidv4(),
      ...data,
    };
    this.cameras.push(newCamera);
    return newCamera;
  }

  async updateCamera(id: string, data: Partial<Camera>): Promise<Camera | null> {
    const index = this.cameras.findIndex(camera => camera.id === id);
    if (index === -1) return null;

    this.cameras[index] = { ...this.cameras[index], ...data };
    return this.cameras[index];
  }

  async deleteCamera(id: string): Promise<boolean> {
    const initialLength = this.cameras.length;
    this.cameras = this.cameras.filter(camera => camera.id !== id);
    return initialLength !== this.cameras.length;
  }

  // Recording operations
  async getRecordings(filters?: { cameraId?: string, startDate?: Date, endDate?: Date }): Promise<Recording[]> {
    let filteredRecordings = [...this.recordings];

    if (filters?.cameraId) {
      filteredRecordings = filteredRecordings.filter(recording => recording.cameraId === filters.cameraId);
    }

    if (filters?.startDate) {
      filteredRecordings = filteredRecordings.filter(recording => recording.startTime >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredRecordings = filteredRecordings.filter(recording => recording.startTime <= filters.endDate!);
    }

    return filteredRecordings;
  }

  async getRecordingById(id: string): Promise<Recording | null> {
    return this.recordings.find(recording => recording.id === id) || null;
  }

  async createRecording(data: InsertRecording): Promise<Recording> {
    const newRecording: Recording = {
      id: uuidv4(),
      ...data,
    };
    this.recordings.push(newRecording);
    return newRecording;
  }

  async updateRecording(id: string, data: Partial<Recording>): Promise<Recording | null> {
    const index = this.recordings.findIndex(recording => recording.id === id);
    if (index === -1) return null;

    this.recordings[index] = { ...this.recordings[index], ...data };
    return this.recordings[index];
  }

  async deleteRecording(id: string): Promise<boolean> {
    const initialLength = this.recordings.length;
    this.recordings = this.recordings.filter(recording => recording.id !== id);
    return initialLength !== this.recordings.length;
  }

  // Alert operations
  async getAlerts(filters?: { cameraId?: string, resolved?: boolean, startDate?: Date, endDate?: Date }): Promise<Alert[]> {
    let filteredAlerts = [...this.alerts];

    if (filters?.cameraId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.cameraId === filters.cameraId);
    }

    if (filters?.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === filters.resolved);
    }

    if (filters?.startDate) {
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp <= filters.endDate!);
    }

    return filteredAlerts;
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return this.alerts.find(alert => alert.id === id) || null;
  }

  async createAlert(data: InsertAlert): Promise<Alert> {
    const newAlert: Alert = {
      id: uuidv4(),
      ...data,
    };
    this.alerts.push(newAlert);
    return newAlert;
  }

  async updateAlert(id: string, data: Partial<Alert>): Promise<Alert | null> {
    const index = this.alerts.findIndex(alert => alert.id === id);
    if (index === -1) return null;

    this.alerts[index] = { ...this.alerts[index], ...data };
    return this.alerts[index];
  }

  async deleteAlert(id: string): Promise<boolean> {
    const initialLength = this.alerts.length;
    this.alerts = this.alerts.filter(alert => alert.id !== id);
    return initialLength !== this.alerts.length;
  }

  // Settings operations
  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(data: InsertSettings): Promise<Settings> {
    this.settings = { ...this.settings, ...data };
    return this.settings;
  }
}

// Export a singleton instance
export const storage = new MemStorage();