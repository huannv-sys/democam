import { storage } from "./storage";

// Track previous frames for motion detection
const previousFrames: Record<number, any> = {};
// Track motion state
const motionState: Record<number, boolean> = {};

/**
 * Simple motion detection by comparing frames
 * In a real application, this would use more sophisticated algorithms
 * 
 * @param cameraId The ID of the camera
 * @param frameData The current frame data
 * @returns True if motion is detected, false otherwise
 */
export async function detectMotion(cameraId: number, frameData: any): Promise<boolean> {
  // Get motion sensitivity from settings
  const settings = await storage.getSettings();
  const sensitivity = settings.motionSensitivity; // 0-100
  
  // If we don't have a previous frame, store this one and return false
  if (!previousFrames[cameraId]) {
    previousFrames[cameraId] = frameData;
    return false;
  }
  
  // In a real application, this would compare the actual pixel data
  // For this example, we'll randomly detect motion with a probability based on sensitivity
  const motionProbability = Math.random() * 100;
  const motionThreshold = 100 - sensitivity; // Higher sensitivity = lower threshold
  
  const motionDetected = motionProbability > motionThreshold;
  
  // Only trigger motion events when state changes from no motion to motion
  // This prevents continuous alerts for the same motion event
  if (motionDetected && !motionState[cameraId]) {
    motionState[cameraId] = true;
    
    // Update previous frame
    previousFrames[cameraId] = frameData;
    
    return true;
  } else if (!motionDetected && motionState[cameraId]) {
    // Reset motion state when motion stops
    motionState[cameraId] = false;
  }
  
  // Update previous frame
  previousFrames[cameraId] = frameData;
  
  return false;
}

// Reset motion detection for a camera (used when changing settings)
export function resetMotionDetection(cameraId: number) {
  delete previousFrames[cameraId];
  delete motionState[cameraId];
}
