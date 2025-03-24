import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Camera } from '@shared/schema';
import { storage } from './storage';
import { detectMotion } from './motion-detection';

// Map to store active camera streams
const activeStreams = new Map<number, NodeJS.Timer>();
// Map to store connected websocket clients by camera ID
const connectedClients = new Map<number, Set<WebSocket>>();

// Initialize WebSocket server for streaming
export function initCameraStreams(server: Server) {
  const wss = new WebSocketServer({ server, path: '/api/stream' });

  wss.on('connection', (ws, req) => {
    // Extract camera ID from query params
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const cameraId = parseInt(url.searchParams.get('cameraId') || '0');

    if (!cameraId) {
      ws.close(1008, 'Invalid camera ID');
      return;
    }

    // Add client to connected clients for this camera
    if (!connectedClients.has(cameraId)) {
      connectedClients.set(cameraId, new Set());
    }
    connectedClients.get(cameraId)?.add(ws);

    // Start streaming if not already started
    startStream(cameraId);

    // Handle client disconnect
    ws.on('close', () => {
      const clients = connectedClients.get(cameraId);
      if (clients) {
        clients.delete(ws);
        
        // If no clients are watching this camera, stop the stream
        if (clients.size === 0) {
          stopStream(cameraId);
        }
      }
    });
  });
}

// Start streaming for a specific camera
async function startStream(cameraId: number) {
  // If stream is already active, do nothing
  if (activeStreams.has(cameraId)) return;

  const camera = await storage.getCamera(cameraId);
  if (!camera) return;

  // Update camera status to online
  await storage.updateCamera(cameraId, { status: 'online' });

  // In a real application, this would connect to the actual camera stream
  // For this example, we'll simulate a stream with random frames
  
  // Simulate camera stream at 24fps (approx 42ms per frame)
  const streamInterval = setInterval(async () => {
    await processFrame(camera);
  }, 42); // ~24fps

  activeStreams.set(cameraId, streamInterval);
}

// Stop streaming for a specific camera
async function stopStream(cameraId: number) {
  const interval = activeStreams.get(cameraId);
  if (interval) {
    clearInterval(interval);
    activeStreams.delete(cameraId);
    
    // Update camera status to offline
    await storage.updateCamera(cameraId, { status: 'offline' });
  }
}

// Process a single frame from the camera
async function processFrame(camera: Camera) {
  // In a real application, this would get the actual frame from the camera
  // For this example, we'll create a simulated frame
  
  // Generate a random frame (in a real app, this would be actual camera data)
  const frameData = generateDummyFrame();
  
  // Check for motion if motion detection is enabled
  if (camera.motionDetection) {
    const motionDetected = await detectMotion(camera.id, frameData);
    
    if (motionDetected) {
      // Create an alert for the motion detection
      await storage.createAlert({
        cameraId: camera.id,
        type: 'motion',
        message: `Motion detected on ${camera.name}`,
        metadata: { timestamp: new Date().toISOString() }
      });

      // Update recording if needed for motion
      // This would be handled by the recording module in a real application
    }
  }
  
  // Send the frame to all connected clients
  const clients = connectedClients.get(camera.id);
  if (clients) {
    const payload = JSON.stringify({
      cameraId: camera.id,
      timestamp: new Date().toISOString(),
      frame: frameData
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}

// Helper function to generate a dummy frame
// In a real app, this would be replaced with actual camera frame data
function generateDummyFrame() {
  // In a real application, this would be the actual frame data from the camera
  // For this example, we return a data URL representing a gray rectangle with timestamp
  const canvas = {
    width: 640,
    height: 480,
    data: Buffer.from([
      // Simulated frame data would go here
      // In real app, this would be actual image data
    ])
  };
  
  return {
    width: canvas.width,
    height: canvas.height,
    timestamp: new Date().toISOString(),
    // In a real app, this would be binary image data
    data: `data:image/jpeg;base64,${Buffer.from(`Simulated frame data at ${new Date().toISOString()}`).toString('base64')}`
  };
}
