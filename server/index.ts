import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import router from './routes';
import path from 'path';

// Create Express application
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', router);

// Socket.IO setup
io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  // Handle motion detection events
  socket.on('motion_detected', (data) => {
    console.log('Motion detected:', data);
    io.emit('motion_alert', {
      cameraId: data.cameraId,
      timestamp: new Date(),
      region: data.region
    });
  });

  // Handle camera status changes
  socket.on('camera_status', (data) => {
    console.log('Camera status changed:', data);
    io.emit('camera_update', data);
  });

  // Handle client disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve static files
app.use('/recordings', express.static(path.join(process.cwd(), 'recordings')));

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

export { app, io };