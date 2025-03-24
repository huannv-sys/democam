import { storage } from "./storage";
import { Camera } from "@shared/schema";

// Map to track active recordings
const activeRecordings = new Map<number, {
  recordingId: number;
  startTime: Date;
  frames: any[]; // In a real app, this might be a file stream
}>();

/**
 * Start recording for a camera
 * 
 * @param cameraId The ID of the camera to record
 * @returns The recording ID
 */
export async function startRecording(cameraId: number): Promise<number> {
  // Check if camera exists
  const camera = await storage.getCamera(cameraId);
  if (!camera) {
    throw new Error(`Camera with ID ${cameraId} not found`);
  }
  
  // Check if recording is already active
  if (activeRecordings.has(cameraId)) {
    return activeRecordings.get(cameraId)!.recordingId;
  }
  
  // Create a new recording record
  const now = new Date();
  const recording = await storage.createRecording({
    cameraId,
    startTime: now,
    hasMotion: false
  });
  
  // Update camera status to recording
  await storage.updateCamera(cameraId, { isRecording: true });
  
  // Initialize recording storage
  activeRecordings.set(cameraId, {
    recordingId: recording.id,
    startTime: now,
    frames: []
  });
  
  return recording.id;
}

/**
 * Stop recording for a camera
 * 
 * @param cameraId The ID of the camera to stop recording
 * @returns The updated recording object
 */
export async function stopRecording(cameraId: number) {
  const activeRecording = activeRecordings.get(cameraId);
  if (!activeRecording) {
    throw new Error(`No active recording for camera ${cameraId}`);
  }
  
  // Get the recording
  const recording = await storage.getRecording(activeRecording.recordingId);
  if (!recording) {
    throw new Error(`Recording with ID ${activeRecording.recordingId} not found`);
  }
  
  // In a real application, this would finalize the video file
  // For this example, we'll just generate a fake file URL
  const endTime = new Date();
  const duration = endTime.getTime() - activeRecording.startTime.getTime();
  const fileUrl = `/recordings/cam${cameraId}_${activeRecording.startTime.toISOString()}.mp4`;
  
  // Update the recording with end time and file URL
  const updatedRecording = await storage.updateRecording(activeRecording.recordingId, {
    endTime,
    fileUrl
  });
  
  // Update camera status
  await storage.updateCamera(cameraId, { isRecording: false });
  
  // Remove from active recordings
  activeRecordings.delete(cameraId);
  
  return updatedRecording;
}

/**
 * Add a frame to the recording
 * In a real application, this would write to a video file
 * 
 * @param cameraId The ID of the camera
 * @param frameData The frame data to add
 * @param hasMotion Whether this frame contains motion
 */
export async function addFrameToRecording(cameraId: number, frameData: any, hasMotion: boolean) {
  const activeRecording = activeRecordings.get(cameraId);
  if (!activeRecording) return;
  
  // In a real application, this would write the frame to a video file
  // For this example, we'll just store it in memory
  activeRecording.frames.push({
    timestamp: new Date(),
    frameData,
    hasMotion
  });
  
  // If this is the first frame with motion, update the recording
  if (hasMotion) {
    await storage.updateRecording(activeRecording.recordingId, { hasMotion: true });
  }
}

/**
 * Get all recordings for a camera
 * 
 * @param cameraId The ID of the camera
 * @returns Array of recordings
 */
export async function getCameraRecordings(cameraId: number) {
  return storage.getRecordings(cameraId);
}

/**
 * Delete old recordings based on retention policy
 */
export async function cleanupOldRecordings() {
  const settings = await storage.getSettings();
  if (!settings.autoDelete) return;
  
  const retentionDays = settings.retentionDays;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const recordings = await storage.getRecordings();
  
  // Find recordings older than the retention period
  for (const recording of recordings) {
    if (recording.startTime < cutoffDate) {
      // In a real application, this would also delete the actual video file
      await storage.deleteRecording(recording.id);
    }
  }
}
