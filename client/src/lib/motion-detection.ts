import { apiRequest } from './queryClient';

/**
 * Reset motion detection for a camera
 * @param cameraId The ID of the camera
 */
export async function resetMotionDetection(cameraId: number): Promise<void> {
  await apiRequest('POST', `/api/cameras/${cameraId}/reset-motion`, {});
}

/**
 * A client-side utility to detect motion in a video frame (canvas)
 * This is just a demo implementation - in a real app, motion detection would happen server-side
 * @param prevFrame Previous frame data
 * @param currentFrame Current frame data
 * @param sensitivity Sensitivity threshold (0-100)
 * @returns True if motion is detected
 */
export function detectMotionInFrame(
  prevFrame: ImageData | null,
  currentFrame: ImageData,
  sensitivity: number = 50
): boolean {
  // If there's no previous frame, can't detect motion
  if (!prevFrame) return false;
  
  // Ensure frames are the same size
  if (
    prevFrame.width !== currentFrame.width ||
    prevFrame.height !== currentFrame.height
  ) {
    return false;
  }
  
  const threshold = 50 - sensitivity / 2; // Convert 0-100 to a working threshold
  const pixelThreshold = 30; // How different a pixel needs to be to count as "different"
  let differentPixels = 0;
  
  // Compare pixels between frames
  for (let i = 0; i < prevFrame.data.length; i += 4) {
    // Calculate difference for RGB channels (ignore alpha)
    const rDiff = Math.abs(prevFrame.data[i] - currentFrame.data[i]);
    const gDiff = Math.abs(prevFrame.data[i + 1] - currentFrame.data[i + 1]);
    const bDiff = Math.abs(prevFrame.data[i + 2] - currentFrame.data[i + 2]);
    
    // If the average difference is above our threshold, count it as a different pixel
    if ((rDiff + gDiff + bDiff) / 3 > pixelThreshold) {
      differentPixels++;
    }
  }
  
  // Calculate percentage of different pixels
  const totalPixels = prevFrame.width * prevFrame.height;
  const percentDifferent = (differentPixels / totalPixels) * 100;
  
  // Return true if the percentage of different pixels is above our threshold
  return percentDifferent > threshold;
}
