import { 
  cameras, type Camera, type InsertCamera, 
  recordings, type Recording, type InsertRecording,
  alerts, type Alert, type InsertAlert,
  settings, type Settings, type InsertSettings
} from "@shared/schema";

export interface IStorage {
  // Camera operations
  getCameras(): Promise<Camera[]>;
  getCamera(id: number): Promise<Camera | undefined>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: number, data: Partial<Camera>): Promise<Camera | undefined>;
  deleteCamera(id: number): Promise<boolean>;
  
  // Recording operations
  getRecordings(cameraId?: number): Promise<Recording[]>;
  getRecording(id: number): Promise<Recording | undefined>;
  createRecording(recording: InsertRecording): Promise<Recording>;
  updateRecording(id: number, data: Partial<Recording>): Promise<Recording | undefined>;
  deleteRecording(id: number): Promise<boolean>;
  
  // Alert operations
  getAlerts(cameraId?: number): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, data: Partial<Alert>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;
  
  // Settings operations
  getSettings(): Promise<Settings>;
  updateSettings(data: Partial<Settings>): Promise<Settings>;
}

export class MemStorage implements IStorage {
  private cameras: Map<number, Camera>;
  private recordings: Map<number, Recording>;
  private alerts: Map<number, Alert>;
  private settings: Settings;
  
  private cameraId: number = 1;
  private recordingId: number = 1;
  private alertId: number = 1;

  constructor() {
    this.cameras = new Map();
    this.recordings = new Map();
    this.alerts = new Map();
    
    // Add some default cameras
    this.createCamera({
      name: "Main Entrance",
      streamUrl: "rtsp://example.com/entrance",
      motionDetection: true
    });
    
    this.createCamera({
      name: "Warehouse",
      streamUrl: "rtsp://example.com/warehouse",
      motionDetection: true
    });
    
    this.createCamera({
      name: "Parking Lot",
      streamUrl: "rtsp://example.com/parking",
      motionDetection: true
    });
    
    this.createCamera({
      name: "Back Door",
      streamUrl: "rtsp://example.com/backdoor",
      motionDetection: true
    });
    
    // Default settings
    this.settings = {
      id: 1,
      motionSensitivity: 50,
      storageLimit: 2048,
      retentionDays: 30,
      autoDelete: true
    };
  }

  // Camera methods
  async getCameras(): Promise<Camera[]> {
    return Array.from(this.cameras.values());
  }

  async getCamera(id: number): Promise<Camera | undefined> {
    return this.cameras.get(id);
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const id = this.cameraId++;
    const now = new Date();
    const camera: Camera = { 
      ...insertCamera, 
      id, 
      status: "offline", 
      isRecording: false,
      createdAt: now
    };
    this.cameras.set(id, camera);
    return camera;
  }

  async updateCamera(id: number, data: Partial<Camera>): Promise<Camera | undefined> {
    const camera = this.cameras.get(id);
    if (!camera) return undefined;
    
    const updatedCamera = { ...camera, ...data };
    this.cameras.set(id, updatedCamera);
    return updatedCamera;
  }

  async deleteCamera(id: number): Promise<boolean> {
    return this.cameras.delete(id);
  }

  // Recording methods
  async getRecordings(cameraId?: number): Promise<Recording[]> {
    let recordings = Array.from(this.recordings.values());
    if (cameraId) {
      recordings = recordings.filter(recording => recording.cameraId === cameraId);
    }
    return recordings;
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    return this.recordings.get(id);
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const id = this.recordingId++;
    const now = new Date();
    const recording: Recording = {
      ...insertRecording,
      id,
      endTime: null,
      fileUrl: null,
      createdAt: now
    };
    this.recordings.set(id, recording);
    return recording;
  }

  async updateRecording(id: number, data: Partial<Recording>): Promise<Recording | undefined> {
    const recording = this.recordings.get(id);
    if (!recording) return undefined;
    
    const updatedRecording = { ...recording, ...data };
    this.recordings.set(id, updatedRecording);
    return updatedRecording;
  }

  async deleteRecording(id: number): Promise<boolean> {
    return this.recordings.delete(id);
  }

  // Alert methods
  async getAlerts(cameraId?: number): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());
    if (cameraId) {
      alerts = alerts.filter(alert => alert.cameraId === cameraId);
    }
    // Sort by timestamp in descending order (newest first)
    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.alertId++;
    const now = new Date();
    const alert: Alert = {
      ...insertAlert,
      id,
      timestamp: now,
      isRead: false
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: number, data: Partial<Alert>): Promise<Alert | undefined> {
    const alert = this.alerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert = { ...alert, ...data };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: number): Promise<boolean> {
    return this.alerts.delete(id);
  }

  // Settings methods
  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(data: Partial<Settings>): Promise<Settings> {
    this.settings = { ...this.settings, ...data };
    return this.settings;
  }
}

export const storage = new MemStorage();
