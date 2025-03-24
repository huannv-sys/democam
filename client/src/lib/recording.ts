import { apiRequest } from './queryClient';
import { Recording } from '@shared/schema';

/**
 * Get recordings for a specific camera or all cameras
 * @param cameraId Optional camera ID to filter by
 * @returns Array of recordings
 */
export async function getRecordings(cameraId?: number): Promise<Recording[]> {
  const url = cameraId 
    ? `/api/recordings?cameraId=${cameraId}` 
    : '/api/recordings';
  
  const response = await apiRequest('GET', url, undefined);
  return await response.json();
}

/**
 * Get a single recording by ID
 * @param recordingId The ID of the recording
 * @returns The recording object
 */
export async function getRecording(recordingId: number): Promise<Recording> {
  const response = await apiRequest('GET', `/api/recordings/${recordingId}`, undefined);
  return await response.json();
}

/**
 * Format a recording duration in human-readable format
 * @param recording The recording object
 * @returns Formatted duration string (e.g., "1h 30m 45s")
 */
export function formatRecordingDuration(recording: Recording): string {
  // If recording hasn't ended yet, use current time
  const startTime = new Date(recording.startTime).getTime();
  const endTime = recording.endTime 
    ? new Date(recording.endTime).getTime() 
    : new Date().getTime();
  
  // Calculate duration in seconds
  const durationSeconds = Math.floor((endTime - startTime) / 1000);
  
  // Format hours, minutes, seconds
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  
  // Build the formatted string
  let formattedDuration = '';
  
  if (hours > 0) {
    formattedDuration += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    formattedDuration += `${minutes}m `;
  }
  
  formattedDuration += `${seconds}s`;
  
  return formattedDuration;
}

/**
 * Generate a thumbnail URL for a recording
 * In a real app, this would return an actual thumbnail
 * @param recording The recording object
 * @returns Thumbnail URL
 */
export function getRecordingThumbnail(recording: Recording): string {
  // In a real app, this would be an actual thumbnail URL
  // For this demo, we'll return a placeholder
  return `/thumbnails/recording_${recording.id}.jpg`;
}
