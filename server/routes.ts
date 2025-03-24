import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initCameraStreams } from "./camera-stream";
import { startRecording, stopRecording, getCameraRecordings } from "./recording";
import { resetMotionDetection } from "./motion-detection";
import { z } from "zod";
import { insertCameraSchema, insertSettingsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize camera streams WebSocket server
  initCameraStreams(httpServer);
  
  // Camera routes
  app.get("/api/cameras", async (req, res) => {
    const cameras = await storage.getCameras();
    res.json(cameras);
  });
  
  app.get("/api/cameras/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid camera ID" });
    }
    
    const camera = await storage.getCamera(id);
    if (!camera) {
      return res.status(404).json({ message: "Camera not found" });
    }
    
    res.json(camera);
  });
  
  app.post("/api/cameras", async (req, res) => {
    try {
      const validatedData = insertCameraSchema.parse(req.body);
      const camera = await storage.createCamera(validatedData);
      res.status(201).json(camera);
    } catch (error) {
      res.status(400).json({ message: "Invalid camera data", error });
    }
  });
  
  app.put("/api/cameras/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid camera ID" });
    }
    
    try {
      const updateSchema = insertCameraSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const camera = await storage.updateCamera(id, validatedData);
      if (!camera) {
        return res.status(404).json({ message: "Camera not found" });
      }
      
      res.json(camera);
    } catch (error) {
      res.status(400).json({ message: "Invalid camera data", error });
    }
  });
  
  app.delete("/api/cameras/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid camera ID" });
    }
    
    const success = await storage.deleteCamera(id);
    if (!success) {
      return res.status(404).json({ message: "Camera not found" });
    }
    
    res.status(204).end();
  });
  
  // Recording routes
  app.get("/api/recordings", async (req, res) => {
    const cameraId = req.query.cameraId ? parseInt(req.query.cameraId as string) : undefined;
    
    if (req.query.cameraId && isNaN(cameraId!)) {
      return res.status(400).json({ message: "Invalid camera ID" });
    }
    
    const recordings = await storage.getRecordings(cameraId);
    res.json(recordings);
  });
  
  app.get("/api/recordings/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid recording ID" });
    }
    
    const recording = await storage.getRecording(id);
    if (!recording) {
      return res.status(404).json({ message: "Recording not found" });
    }
    
    res.json(recording);
  });
  
  app.post("/api/cameras/:id/start-recording", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid camera ID" });
    }
    
    try {
      const recordingId = await startRecording(id);
      res.status(201).json({ recordingId });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  app.post("/api/cameras/:id/stop-recording", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid camera ID" });
    }
    
    try {
      const recording = await stopRecording(id);
      res.json(recording);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Alert routes
  app.get("/api/alerts", async (req, res) => {
    const cameraId = req.query.cameraId ? parseInt(req.query.cameraId as string) : undefined;
    
    if (req.query.cameraId && isNaN(cameraId!)) {
      return res.status(400).json({ message: "Invalid camera ID" });
    }
    
    const alerts = await storage.getAlerts(cameraId);
    res.json(alerts);
  });
  
  app.get("/api/alerts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid alert ID" });
    }
    
    const alert = await storage.getAlert(id);
    if (!alert) {
      return res.status(404).json({ message: "Alert not found" });
    }
    
    res.json(alert);
  });
  
  app.put("/api/alerts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid alert ID" });
    }
    
    try {
      const updateSchema = z.object({
        isRead: z.boolean().optional()
      });
      
      const validatedData = updateSchema.parse(req.body);
      const alert = await storage.updateAlert(id, validatedData);
      
      if (!alert) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json(alert);
    } catch (error) {
      res.status(400).json({ message: "Invalid alert data", error });
    }
  });
  
  app.delete("/api/alerts/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid alert ID" });
    }
    
    const success = await storage.deleteAlert(id);
    if (!success) {
      return res.status(404).json({ message: "Alert not found" });
    }
    
    res.status(204).end();
  });
  
  // Settings routes
  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });
  
  app.put("/api/settings", async (req, res) => {
    try {
      const updateSchema = insertSettingsSchema.partial();
      const validatedData = updateSchema.parse(req.body);
      
      const settings = await storage.updateSettings(validatedData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data", error });
    }
  });
  
  // Motion detection routes
  app.post("/api/cameras/:id/reset-motion", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid camera ID" });
    }
    
    resetMotionDetection(id);
    res.status(204).end();
  });

  return httpServer;
}
