import { z } from 'zod';
import { createInsertSchema } from 'drizzle-zod';

// Camera model
export const cameraSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  enabled: z.boolean().default(true),
  motionDetection: z.boolean().default(true),
  motionSensitivity: z.number().min(0).max(100).default(50),
  recordOnMotion: z.boolean().default(true),
});

export type Camera = z.infer<typeof cameraSchema>;
export const insertCameraSchema = cameraSchema.omit({ id: true });
export type InsertCamera = z.infer<typeof insertCameraSchema>;

// Recording model
export const recordingSchema = z.object({
  id: z.string(),
  cameraId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  duration: z.number().optional(),
  path: z.string(),
  thumbnail: z.string().optional(),
  triggeredByMotion: z.boolean().default(false),
  motionRegion: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
});

export type Recording = z.infer<typeof recordingSchema>;
export const insertRecordingSchema = recordingSchema.omit({ id: true });
export type InsertRecording = z.infer<typeof insertRecordingSchema>;

// Alert model
export const alertSchema = z.object({
  id: z.string(),
  cameraId: z.string(),
  timestamp: z.date(),
  type: z.enum(['MOTION', 'CONNECTION_LOST', 'CUSTOM']),
  message: z.string(),
  resolved: z.boolean().default(false),
  recordingId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type Alert = z.infer<typeof alertSchema>;
export const insertAlertSchema = alertSchema.omit({ id: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Settings model
export const settingsSchema = z.object({
  id: z.string().default('settings'),
  storageLocation: z.string().default('./recordings'),
  maxStorageSize: z.number().default(10 * 1024 * 1024 * 1024), // 10 GB
  retentionPeriod: z.number().default(30), // days
  defaultMotionSensitivity: z.number().min(0).max(100).default(50),
  recordingFormat: z.enum(['MP4', 'WEBM']).default('MP4'),
  maxConcurrentStreams: z.number().default(4),
  notificationsEnabled: z.boolean().default(true),
});

export type Settings = z.infer<typeof settingsSchema>;
export const insertSettingsSchema = settingsSchema.omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;