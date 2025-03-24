import { Router } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { insertCameraSchema, insertRecordingSchema, insertAlertSchema, insertSettingsSchema } from '../shared/schema';

const router = Router();

// Helper to handle async routes
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Cameras
router.get('/cameras', asyncHandler(async (req, res) => {
  const cameras = await storage.getCameras();
  res.json(cameras);
}));

router.get('/cameras/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const camera = await storage.getCameraById(id);
  
  if (!camera) {
    return res.status(404).json({ error: 'Camera not found' });
  }
  
  res.json(camera);
}));

router.post('/cameras', asyncHandler(async (req, res) => {
  try {
    const validatedData = insertCameraSchema.parse(req.body);
    const camera = await storage.createCamera(validatedData);
    res.status(201).json(camera);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
}));

router.patch('/cameras/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const validatedData = insertCameraSchema.partial().parse(req.body);
    const camera = await storage.updateCamera(id, validatedData);
    
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    
    res.json(camera);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
}));

router.delete('/cameras/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const success = await storage.deleteCamera(id);
  
  if (!success) {
    return res.status(404).json({ error: 'Camera not found' });
  }
  
  res.status(204).end();
}));

// Recordings
router.get('/recordings', asyncHandler(async (req, res) => {
  const { cameraId, startDate, endDate } = req.query;
  
  const filters: any = {};
  if (cameraId) filters.cameraId = String(cameraId);
  if (startDate) filters.startDate = new Date(String(startDate));
  if (endDate) filters.endDate = new Date(String(endDate));
  
  const recordings = await storage.getRecordings(filters);
  res.json(recordings);
}));

router.get('/recordings/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const recording = await storage.getRecordingById(id);
  
  if (!recording) {
    return res.status(404).json({ error: 'Recording not found' });
  }
  
  res.json(recording);
}));

router.post('/recordings', asyncHandler(async (req, res) => {
  try {
    const validatedData = insertRecordingSchema.parse(req.body);
    const recording = await storage.createRecording(validatedData);
    res.status(201).json(recording);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
}));

router.patch('/recordings/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const validatedData = insertRecordingSchema.partial().parse(req.body);
    const recording = await storage.updateRecording(id, validatedData);
    
    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    res.json(recording);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
}));

router.delete('/recordings/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const success = await storage.deleteRecording(id);
  
  if (!success) {
    return res.status(404).json({ error: 'Recording not found' });
  }
  
  res.status(204).end();
}));

// Alerts
router.get('/alerts', asyncHandler(async (req, res) => {
  const { cameraId, resolved, startDate, endDate } = req.query;
  
  const filters: any = {};
  if (cameraId) filters.cameraId = String(cameraId);
  if (resolved !== undefined) filters.resolved = resolved === 'true';
  if (startDate) filters.startDate = new Date(String(startDate));
  if (endDate) filters.endDate = new Date(String(endDate));
  
  const alerts = await storage.getAlerts(filters);
  res.json(alerts);
}));

router.get('/alerts/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const alert = await storage.getAlertById(id);
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  res.json(alert);
}));

router.post('/alerts', asyncHandler(async (req, res) => {
  try {
    const validatedData = insertAlertSchema.parse(req.body);
    const alert = await storage.createAlert(validatedData);
    res.status(201).json(alert);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
}));

router.patch('/alerts/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const validatedData = insertAlertSchema.partial().parse(req.body);
    const alert = await storage.updateAlert(id, validatedData);
    
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
}));

router.delete('/alerts/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const success = await storage.deleteAlert(id);
  
  if (!success) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  res.status(204).end();
}));

// Settings
router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await storage.getSettings();
  res.json(settings);
}));

router.patch('/settings', asyncHandler(async (req, res) => {
  try {
    const validatedData = insertSettingsSchema.partial().parse(req.body);
    const settings = await storage.updateSettings(validatedData);
    res.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    throw error;
  }
}));

export default router;