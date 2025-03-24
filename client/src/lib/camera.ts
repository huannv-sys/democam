import { apiRequest } from './queryClient';
import { Camera } from '@shared/schema';

/**
 * Connect to a camera stream via WebSocket
 * @param cameraId The ID of the camera
 * @param onFrame Callback function when a frame is received
 * @param onError Callback function when an error occurs
 * @returns WebSocket instance
 */
export function connectToCamera(
  cameraId: number,
  onFrame: (frame: any) => void,
  onError?: (error: Event) => void
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/api/stream?cameraId=${cameraId}`);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.frame) {
        onFrame(data);
      }
    } catch (error) {
      console.error('Error parsing camera frame:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error(`Camera stream error for camera ${cameraId}:`, error);
    if (onError) {
      onError(error);
    }
  };
  
  return ws;
}

/**
 * Start recording for a camera
 * @param cameraId The ID of the camera
 * @returns The recording ID
 */
export async function startRecording(cameraId: number): Promise<number> {
  const response = await apiRequest('POST', `/api/cameras/${cameraId}/start-recording`, {});
  const data = await response.json();
  return data.recordingId;
}

/**
 * Stop recording for a camera
 * @param cameraId The ID of the camera
 * @returns The recording object
 */
export async function stopRecording(cameraId: number) {
  const response = await apiRequest('POST', `/api/cameras/${cameraId}/stop-recording`, {});
  return await response.json();
}

/**
 * Add a new camera
 * @param cameraData The camera data
 * @returns The created camera
 */
export async function addCamera(cameraData: Omit<Camera, 'id' | 'status' | 'isRecording' | 'createdAt'>): Promise<Camera> {
  const response = await apiRequest('POST', '/api/cameras', cameraData);
  return await response.json();
}

/**
 * Update a camera
 * @param cameraId The ID of the camera
 * @param cameraData The camera data to update
 * @returns The updated camera
 */
export async function updateCamera(cameraId: number, cameraData: Partial<Camera>): Promise<Camera> {
  const response = await apiRequest('PUT', `/api/cameras/${cameraId}`, cameraData);
  return await response.json();
}

/**
 * Delete a camera
 * @param cameraId The ID of the camera
 * @returns True if successful
 */
export async function deleteCamera(cameraId: number): Promise<boolean> {
  await apiRequest('DELETE', `/api/cameras/${cameraId}`, undefined);
  return true;
}
