const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const onvif = require('node-onvif');
const Stream = require('node-rtsp-stream');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client/dist'));

// Store connected cameras
const cameras = [];
const streams = {};

// ONVIF Camera discovery
app.get('/api/discover', async (req, res) => {
  try {
    console.log('Starting camera discovery...');
    
    // Discover all ONVIF devices on the network
    const devices = await new Promise((resolve) => {
      onvif.startProbe().then((deviceList) => {
        console.log(`Found ${deviceList.length} devices`);
        resolve(deviceList);
      }).catch(error => {
        console.error('Error during discovery:', error);
        resolve([]);
      });
    });
    
    // Process and return discovered devices
    const discoveredCameras = devices.map((device, index) => {
      return {
        id: `camera-${index}`,
        name: device.name || `Camera ${index + 1}`,
        manufacturer: device.manufacturer || 'Unknown',
        model: device.model || 'Unknown',
        address: device.xaddrs[0] || '',
        type: 'ONVIF'
      };
    });
    
    res.json(discoveredCameras);
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({ error: 'Failed to discover cameras' });
  }
});

// Add a camera manually
app.post('/api/cameras', (req, res) => {
  try {
    const { name, url, type, username, password } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }
    
    const id = `camera-${Date.now()}`;
    const newCamera = {
      id,
      name,
      url,
      type: type || 'RTSP',
      username,
      password,
      status: 'disconnected'
    };
    
    cameras.push(newCamera);
    res.status(201).json(newCamera);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add camera' });
  }
});

// Get all cameras
app.get('/api/cameras', (req, res) => {
  res.json(cameras);
});

// Get specific camera
app.get('/api/cameras/:id', (req, res) => {
  const camera = cameras.find(c => c.id === req.params.id);
  if (!camera) {
    return res.status(404).json({ error: 'Camera not found' });
  }
  res.json(camera);
});

// Delete camera
app.delete('/api/cameras/:id', (req, res) => {
  const index = cameras.findIndex(c => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Camera not found' });
  }
  
  // Stop stream if it exists
  if (streams[req.params.id]) {
    try {
      streams[req.params.id].stop();
      delete streams[req.params.id];
    } catch (error) {
      console.error(`Error stopping stream for ${req.params.id}:`, error);
    }
  }
  
  cameras.splice(index, 1);
  res.json({ message: 'Camera deleted successfully' });
});

// Connect to camera stream
app.post('/api/cameras/:id/connect', (req, res) => {
  try {
    const camera = cameras.find(c => c.id === req.params.id);
    if (!camera) {
      return res.status(404).json({ error: 'Camera not found' });
    }
    
    // If stream already exists, stop it
    if (streams[camera.id]) {
      try {
        streams[camera.id].stop();
      } catch (error) {
        console.error(`Error stopping existing stream: ${error}`);
      }
    }
    
    // Setup RTSP stream
    const streamUrl = camera.url;
    const wsPort = 9000 + cameras.indexOf(camera); // Unique port for each camera
    
    console.log(`Starting stream for ${camera.name} at ${streamUrl} on port ${wsPort}`);
    
    const stream = new Stream({
      name: camera.id,
      streamUrl: streamUrl,
      wsPort: wsPort,
      ffmpegOptions: {
        '-stats': '',
        '-r': 30,
        '-q:v': 3
      }
    });
    
    streams[camera.id] = stream;
    camera.status = 'connected';
    camera.wsPort = wsPort;
    
    res.json({ 
      message: 'Camera connected',
      wsPort: wsPort,
      streamId: camera.id
    });
    
    // Notify all clients about camera status change
    io.emit('cameraStatusChanged', { id: camera.id, status: 'connected' });
    
  } catch (error) {
    console.error('Connection error:', error);
    res.status(500).json({ error: 'Failed to connect to camera' });
  }
});

// Disconnect camera stream
app.post('/api/cameras/:id/disconnect', (req, res) => {
  const camera = cameras.find(c => c.id === req.params.id);
  if (!camera) {
    return res.status(404).json({ error: 'Camera not found' });
  }
  
  if (streams[camera.id]) {
    try {
      streams[camera.id].stop();
      delete streams[camera.id];
      camera.status = 'disconnected';
      
      res.json({ message: 'Camera disconnected' });
      io.emit('cameraStatusChanged', { id: camera.id, status: 'disconnected' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to disconnect camera' });
    }
  } else {
    res.status(400).json({ error: 'Camera stream not active' });
  }
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send current camera list to new clients
  socket.emit('cameraList', cameras);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});