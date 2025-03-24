import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Camera model
export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  streamUrl: text("stream_url").notNull(),
  status: text("status").notNull().default("offline"),
  motionDetection: boolean("motion_detection").default(true),
  isRecording: boolean("is_recording").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCameraSchema = createInsertSchema(cameras).omit({
  id: true,
  createdAt: true,
  status: true,
  isRecording: true
});

// Recording model
export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  fileUrl: text("file_url"),
  hasMotion: boolean("has_motion").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  createdAt: true,
  endTime: true,
  fileUrl: true,
});

// Alert model
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").notNull(),
  type: text("type").notNull(), // motion, connection, etc.
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
  isRead: true,
});

// Settings model
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  motionSensitivity: integer("motion_sensitivity").default(50),
  storageLimit: integer("storage_limit").default(2048), // In GB
  retentionDays: integer("retention_days").default(30),
  autoDelete: boolean("auto_delete").default(true),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

// Define types for our models
export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = z.infer<typeof insertCameraSchema>;

export type Recording = typeof recordings.$inferSelect;
export type InsertRecording = z.infer<typeof insertRecordingSchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
