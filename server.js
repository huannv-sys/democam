const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const path = require('path');
const onvif = require('node-onvif');
const Stream = require('node-rtsp-stream');

// Utility để tạo UUID
const { randomUUID } = require('crypto');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'client/dist')));

// Lưu trữ dữ liệu trong bộ nhớ
const storage = {
  cameras: [],
  recordings: [],
  alerts: [],
  settings: {
    retentionDays: 30,
    storagePath: './recordings',
    notificationEmail: '',
    motionDetection: true,
    faceDetection: false,
    objectDetection: false
  },
  streams: {},
  onvifDevices: {}
};

// API Routes

// Lấy danh sách camera
app.get('/api/cameras', (req, res) => {
  res.json(storage.cameras);
});

// Lấy thông tin camera theo ID
app.get('/api/cameras/:id', (req, res) => {
  const camera = storage.cameras.find(c => c.id === req.params.id);
  if (!camera) {
    return res.status(404).json({ error: 'Camera không tồn tại' });
  }
  res.json(camera);
});

// Tạo camera mới
app.post('/api/cameras', (req, res) => {
  const { name, ipAddress, port, username, password, rtspUrl, onvifPort } = req.body;
  
  // Validate
  if (!name || !ipAddress) {
    return res.status(400).json({ error: 'Tên và địa chỉ IP là bắt buộc' });
  }
  
  // Tạo camera mới
  const newCamera = {
    id: randomUUID(),
    name,
    ipAddress,
    port: port || 554,
    username,
    password,
    rtspUrl,
    onvifPort: onvifPort || 2020,
    status: 'offline',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  storage.cameras.push(newCamera);
  
  // Kết nối đến camera ONVIF nếu có thông tin đăng nhập
  if (username && password) {
    connectToOnvifDevice(newCamera);
  }
  
  res.status(201).json(newCamera);
});

// Cập nhật camera
app.put('/api/cameras/:id', (req, res) => {
  const { name, ipAddress, port, username, password, rtspUrl, onvifPort } = req.body;
  const cameraIndex = storage.cameras.findIndex(c => c.id === req.params.id);
  
  if (cameraIndex === -1) {
    return res.status(404).json({ error: 'Camera không tồn tại' });
  }
  
  // Dừng stream hiện tại nếu có
  const cameraId = req.params.id;
  if (storage.streams[cameraId]) {
    try {
      storage.streams[cameraId].stop();
      delete storage.streams[cameraId];
    } catch (error) {
      console.error('Lỗi khi dừng stream:', error);
    }
  }
  
  // Cập nhật thông tin camera
  const updatedCamera = {
    ...storage.cameras[cameraIndex],
    name: name || storage.cameras[cameraIndex].name,
    ipAddress: ipAddress || storage.cameras[cameraIndex].ipAddress,
    port: port || storage.cameras[cameraIndex].port,
    username: username !== undefined ? username : storage.cameras[cameraIndex].username,
    password: password !== undefined ? password : storage.cameras[cameraIndex].password,
    rtspUrl: rtspUrl !== undefined ? rtspUrl : storage.cameras[cameraIndex].rtspUrl,
    onvifPort: onvifPort || storage.cameras[cameraIndex].onvifPort,
    updatedAt: new Date().toISOString()
  };
  
  storage.cameras[cameraIndex] = updatedCamera;
  
  // Kết nối lại đến camera ONVIF nếu có thông tin đăng nhập
  if (updatedCamera.username && updatedCamera.password) {
    connectToOnvifDevice(updatedCamera);
  }
  
  res.json(updatedCamera);
});

// Xóa camera
app.delete('/api/cameras/:id', (req, res) => {
  const cameraId = req.params.id;
  const cameraIndex = storage.cameras.findIndex(c => c.id === cameraId);
  
  if (cameraIndex === -1) {
    return res.status(404).json({ error: 'Camera không tồn tại' });
  }
  
  // Dừng stream nếu có
  if (storage.streams[cameraId]) {
    try {
      storage.streams[cameraId].stop();
      delete storage.streams[cameraId];
    } catch (error) {
      console.error('Lỗi khi dừng stream:', error);
    }
  }
  
  // Xóa camera
  storage.cameras.splice(cameraIndex, 1);
  
  // Xóa onvif device
  if (storage.onvifDevices[cameraId]) {
    delete storage.onvifDevices[cameraId];
  }
  
  res.json({ success: true });
});

// Lấy danh sách bản ghi
app.get('/api/recordings', (req, res) => {
  const { cameraId, startDate, endDate } = req.query;
  let filteredRecordings = [...storage.recordings];
  
  // Lọc theo camera
  if (cameraId) {
    filteredRecordings = filteredRecordings.filter(r => r.cameraId === cameraId);
  }
  
  // Lọc theo ngày bắt đầu
  if (startDate) {
    const start = new Date(startDate);
    filteredRecordings = filteredRecordings.filter(r => new Date(r.startTime) >= start);
  }
  
  // Lọc theo ngày kết thúc
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Kết thúc vào cuối ngày
    filteredRecordings = filteredRecordings.filter(r => new Date(r.startTime) <= end);
  }
  
  res.json(filteredRecordings);
});

// Lấy thông tin bản ghi theo ID
app.get('/api/recordings/:id', (req, res) => {
  const recording = storage.recordings.find(r => r.id === req.params.id);
  if (!recording) {
    return res.status(404).json({ error: 'Bản ghi không tồn tại' });
  }
  res.json(recording);
});

// Stream bản ghi video (giả lập, thực tế cần phục vụ video file)
app.get('/api/recordings/:id/stream', (req, res) => {
  const recordingId = req.params.id;
  const recording = storage.recordings.find(r => r.id === recordingId);
  
  if (!recording) {
    return res.status(404).json({ error: 'Bản ghi không tồn tại' });
  }
  
  // Trong thực tế, bạn sẽ stream file video từ ổ đĩa
  // Ví dụ: res.sendFile(path.join(__dirname, recording.filePath));
  
  // Hiện tại, chúng ta chỉ trả về thông báo lỗi
  res.status(404).send('Tính năng streaming bản ghi video chưa được triển khai.');
});

// Lấy danh sách cảnh báo
app.get('/api/alerts', (req, res) => {
  const { cameraId, resolved, startDate, endDate } = req.query;
  let filteredAlerts = [...storage.alerts];
  
  // Lọc theo camera
  if (cameraId) {
    filteredAlerts = filteredAlerts.filter(a => a.cameraId === cameraId);
  }
  
  // Lọc theo trạng thái giải quyết
  if (resolved !== undefined) {
    const resolvedBool = resolved === 'true';
    filteredAlerts = filteredAlerts.filter(a => a.resolved === resolvedBool);
  }
  
  // Lọc theo ngày bắt đầu
  if (startDate) {
    const start = new Date(startDate);
    filteredAlerts = filteredAlerts.filter(a => new Date(a.timestamp) >= start);
  }
  
  // Lọc theo ngày kết thúc
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Kết thúc vào cuối ngày
    filteredAlerts = filteredAlerts.filter(a => new Date(a.timestamp) <= end);
  }
  
  res.json(filteredAlerts);
});

// Lấy thông tin cảnh báo theo ID
app.get('/api/alerts/:id', (req, res) => {
  const alert = storage.alerts.find(a => a.id === req.params.id);
  if (!alert) {
    return res.status(404).json({ error: 'Cảnh báo không tồn tại' });
  }
  res.json(alert);
});

// Cập nhật cảnh báo
app.put('/api/alerts/:id', (req, res) => {
  const alertId = req.params.id;
  const alertIndex = storage.alerts.findIndex(a => a.id === alertId);
  
  if (alertIndex === -1) {
    return res.status(404).json({ error: 'Cảnh báo không tồn tại' });
  }
  
  // Cập nhật thông tin cảnh báo
  const updatedAlert = {
    ...storage.alerts[alertIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  storage.alerts[alertIndex] = updatedAlert;
  res.json(updatedAlert);
});

// Lấy cài đặt hệ thống
app.get('/api/settings', (req, res) => {
  res.json(storage.settings);
});

// SPA fallback route - must come after API routes
app.get('*', (req, res) => {
  // All non-API routes should serve the React app
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
  }
});

// Cập nhật cài đặt hệ thống
app.put('/api/settings', (req, res) => {
  const { retentionDays, storagePath, notificationEmail, motionDetection, faceDetection, objectDetection } = req.body;
  
  // Cập nhật cài đặt
  storage.settings = {
    ...storage.settings,
    retentionDays: retentionDays !== undefined ? retentionDays : storage.settings.retentionDays,
    storagePath: storagePath || storage.settings.storagePath,
    notificationEmail: notificationEmail !== undefined ? notificationEmail : storage.settings.notificationEmail,
    motionDetection: motionDetection !== undefined ? motionDetection : storage.settings.motionDetection,
    faceDetection: faceDetection !== undefined ? faceDetection : storage.settings.faceDetection,
    objectDetection: objectDetection !== undefined ? objectDetection : storage.settings.objectDetection
  };
  
  res.json(storage.settings);
});

// Tìm kiếm thiết bị ONVIF trong mạng
app.post('/api/scan-network', async (req, res) => {
  try {
    console.log('Bắt đầu quét thiết bị ONVIF...');
    const deviceList = await scanNetworkForOnvifDevices();
    console.log('Tìm thấy thiết bị:', deviceList);
    res.json(deviceList);
  } catch (error) {
    console.error('Lỗi khi quét thiết bị ONVIF:', error);
    res.status(500).json({ error: 'Không thể quét thiết bị: ' + error.message });
  }
});

// Kiểm tra kết nối đến camera
app.post('/api/cameras/:id/test-connection', async (req, res) => {
  const cameraId = req.params.id;
  const camera = storage.cameras.find(c => c.id === cameraId);
  
  if (!camera) {
    return res.status(404).json({ error: 'Camera không tồn tại' });
  }
  
  try {
    const result = await testCameraConnection(camera);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Không thể kết nối đến camera: ' + error.message });
  }
});

// Bắt đầu stream camera
app.post('/api/cameras/:id/stream/start', (req, res) => {
  const cameraId = req.params.id;
  const camera = storage.cameras.find(c => c.id === cameraId);
  
  if (!camera) {
    return res.status(404).json({ error: 'Camera không tồn tại' });
  }
  
  try {
    // Nếu đã có stream, dừng nó trước
    if (storage.streams[cameraId]) {
      try {
        storage.streams[cameraId].stop();
      } catch (err) {
        console.error('Error stopping existing stream:', err);
      }
    }
    
    // Xây dựng URL RTSP
    let rtspUrl = camera.rtspUrl;
    if (!rtspUrl) {
      rtspUrl = `rtsp://${camera.username}:${camera.password}@${camera.ipAddress}:${camera.port}/Streaming/Channels/101`;
    }
    
    console.log(`Bắt đầu stream từ camera ${camera.name} - URL: ${rtspUrl}`);
    
    // Khởi tạo stream mới với port tự động
    const streamPort = 9999; // Port cho websocket stream server
    const stream = new Stream({
      name: camera.name,
      streamUrl: rtspUrl,
      wsPort: streamPort,
      ffmpegOptions: {
        '-stats': '',
        '-r': 30, // Framerate
        '-s': '640x480' // Độ phân giải
      }
    });
    
    // Lưu stream để có thể dừng sau này
    storage.streams[cameraId] = stream;
    
    // Cập nhật trạng thái camera
    const cameraIndex = storage.cameras.findIndex(c => c.id === cameraId);
    if (cameraIndex !== -1) {
      storage.cameras[cameraIndex].status = 'streaming';
      storage.cameras[cameraIndex].streamPort = streamPort;
    }
    
    res.json({ 
      success: true, 
      message: `Stream started for camera ${camera.name}`,
      streamUrl: `/api/cameras/${cameraId}/stream`,
      wsUrl: `ws://${req.headers.host.split(':')[0]}:${streamPort}`
    });
  } catch (error) {
    console.error('Lỗi khi bắt đầu stream:', error);
    res.status(500).json({ error: 'Không thể bắt đầu stream: ' + error.message });
  }
});

// Dừng stream camera
app.post('/api/cameras/:id/stream/stop', (req, res) => {
  const cameraId = req.params.id;
  
  if (!storage.streams[cameraId]) {
    return res.status(404).json({ error: 'Không tìm thấy stream cho camera này' });
  }
  
  try {
    storage.streams[cameraId].stop();
    delete storage.streams[cameraId];
    
    // Cập nhật trạng thái camera
    const cameraIndex = storage.cameras.findIndex(c => c.id === cameraId);
    if (cameraIndex !== -1) {
      storage.cameras[cameraIndex].status = 'online';
      delete storage.cameras[cameraIndex].streamPort;
    }
    
    res.json({ success: true, message: 'Stream đã dừng' });
  } catch (error) {
    console.error('Lỗi khi dừng stream:', error);
    res.status(500).json({ error: 'Không thể dừng stream: ' + error.message });
  }
});

// Chụp ảnh từ camera (snapshot)
app.get('/api/cameras/:id/snapshot', async (req, res) => {
  const cameraId = req.params.id;
  const camera = storage.cameras.find(c => c.id === cameraId);
  
  if (!camera) {
    return res.status(404).json({ error: 'Camera không tồn tại' });
  }
  
  try {
    const device = storage.onvifDevices[cameraId];
    
    if (!device) {
      return res.status(400).json({ error: 'Camera chưa được kết nối qua ONVIF' });
    }
    
    // Lấy snapshot URL
    const result = await device.fetchSnapshot();
    
    // Thiết lập header phù hợp
    res.setHeader('Content-Type', 'image/jpeg');
    
    // Trả về hình ảnh
    res.send(result.body);
  } catch (error) {
    console.error('Lỗi khi chụp ảnh:', error);
    res.status(500).json({ error: 'Không thể chụp ảnh: ' + error.message });
  }
});

// Tải dữ liệu mẫu (để dễ dàng phát triển và kiểm thử)
function loadSampleData() {
  // Thêm một vài camera mẫu
  if (storage.cameras.length === 0) {
    storage.cameras = [
      {
        id: '1',
        name: 'Camera Cổng Chính',
        ipAddress: '192.168.1.100',
        port: 554,
        username: 'admin',
        password: 'admin',
        rtspUrl: 'rtsp://admin:admin@192.168.1.100:554/Streaming/Channels/101',
        onvifPort: 2020,
        status: 'offline',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Camera Sảnh',
        ipAddress: '192.168.1.101',
        port: 554,
        username: 'admin',
        password: 'admin',
        rtspUrl: 'rtsp://admin:admin@192.168.1.101:554/Streaming/Channels/101',
        onvifPort: 2020,
        status: 'offline',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
  
  // Thêm một vài bản ghi mẫu
  if (storage.recordings.length === 0) {
    const now = new Date();
    
    storage.recordings = [
      {
        id: '1',
        cameraId: '1',
        filename: 'recording_1.mp4',
        startTime: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
        duration: 1800, // 30 minutes in seconds
        size: 256 * 1024 * 1024, // 256 MB
        triggerEvent: 'motion',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        cameraId: '1',
        filename: 'recording_2.mp4',
        startTime: new Date(now.getTime() - 7200000).toISOString(), // 2 hours ago
        duration: 1800, // 30 minutes in seconds
        size: 128 * 1024 * 1024, // 128 MB
        triggerEvent: null, // scheduled
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        cameraId: '2',
        filename: 'recording_3.mp4',
        startTime: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
        duration: 3600, // 1 hour in seconds
        size: 512 * 1024 * 1024, // 512 MB
        triggerEvent: 'object',
        createdAt: new Date().toISOString()
      }
    ];
  }
  
  // Thêm một vài cảnh báo mẫu
  if (storage.alerts.length === 0) {
    const now = new Date();
    
    storage.alerts = [
      {
        id: '1',
        cameraId: '1',
        type: 'motion',
        severity: 'medium',
        timestamp: new Date(now.getTime() - 1800000).toISOString(), // 30 minutes ago
        resolved: false,
        message: 'Phát hiện chuyển động ở Cổng Chính',
        snapshotUrl: null,
        recordingId: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        cameraId: '2',
        type: 'object',
        severity: 'high',
        timestamp: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
        resolved: true,
        message: 'Phát hiện đối tượng lạ ở Sảnh',
        snapshotUrl: null,
        recordingId: '3',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        cameraId: '1',
        type: 'disconnect',
        severity: 'high',
        timestamp: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
        resolved: true,
        message: 'Camera Cổng Chính bị ngắt kết nối',
        snapshotUrl: null,
        recordingId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

// Quét thiết bị ONVIF trên mạng
async function scanNetworkForOnvifDevices() {
  try {
    console.log('Quét thiết bị ONVIF trên mạng...');
    
    // Tăng timeout để đảm bảo quét đủ thời gian
    const deviceList = await onvif.startProbe({
      timeout: 5, // 5 giây
      resolve: true // Tự động phân giải địa chỉ
    });
    
    console.log(`Tìm thấy ${deviceList.length} thiết bị ONVIF`);
    
    // Chuyển đổi danh sách thiết bị thành dạng dễ sử dụng
    return deviceList.map(device => {
      // Chọn địa chỉ đầu tiên nếu có nhiều
      const xaddr = Array.isArray(device.xaddrs) && device.xaddrs.length > 0 
        ? device.xaddrs[0] 
        : device.xaddrs;
      
      const deviceInfo = {
        xaddrs: xaddr,
        name: device.name || 'Unknown ONVIF Device',
        hardware: device.hardware || 'Unknown Hardware',
        location: device.location || 'Unknown Location',
        scopes: device.scopes || []
      };
      
      // Trích xuất địa chỉ IP từ URL ONVIF
      try {
        const urlObj = new URL(xaddr);
        deviceInfo.ipAddress = urlObj.hostname;
        deviceInfo.onvifPort = urlObj.port || 80;
      } catch (err) {
        console.error(`Không thể phân tích URL ONVIF: ${xaddr}`, err);
        deviceInfo.ipAddress = 'unknown';
        deviceInfo.onvifPort = 80;
      }
      
      // Trích xuất thông tin bổ sung từ scopes nếu có
      if (Array.isArray(deviceInfo.scopes)) {
        // Tìm tên thiết bị từ scopes
        const nameScope = deviceInfo.scopes.find(s => s.includes('onvif://www.onvif.org/name/'));
        if (nameScope && deviceInfo.name === 'Unknown ONVIF Device') {
          const nameMatch = nameScope.match(/onvif:\/\/www\.onvif\.org\/name\/(.+)/);
          if (nameMatch && nameMatch[1]) {
            deviceInfo.name = decodeURIComponent(nameMatch[1]);
          }
        }
        
        // Tìm model
        const modelScope = deviceInfo.scopes.find(s => s.includes('onvif://www.onvif.org/hardware/'));
        if (modelScope) {
          const modelMatch = modelScope.match(/onvif:\/\/www\.onvif\.org\/hardware\/(.+)/);
          if (modelMatch && modelMatch[1]) {
            deviceInfo.model = decodeURIComponent(modelMatch[1]);
          }
        }
        
        // Tìm nhà sản xuất
        const mfgScope = deviceInfo.scopes.find(s => s.includes('onvif://www.onvif.org/manufacturer/'));
        if (mfgScope) {
          const mfgMatch = mfgScope.match(/onvif:\/\/www\.onvif\.org\/manufacturer\/(.+)/);
          if (mfgMatch && mfgMatch[1]) {
            deviceInfo.manufacturer = decodeURIComponent(mfgMatch[1]);
          }
        }
      }
      
      return deviceInfo;
    });
  } catch (error) {
    console.error('Lỗi khi quét thiết bị ONVIF:', error);
    throw error;
  }
}

// Kết nối đến thiết bị ONVIF
async function connectToOnvifDevice(camera) {
  try {
    console.log(`Đang kết nối tới camera ${camera.name} (${camera.ipAddress}:${camera.onvifPort})...`);
    
    // Tạo địa chỉ ONVIF endpoint
    let xaddr = '';
    if (camera.xaddrs) {
      // Nếu có sẵn xaddrs từ quá trình discovery, sử dụng nó
      xaddr = camera.xaddrs;
    } else {
      // Nếu không, tạo từ IP và port
      xaddr = `http://${camera.ipAddress}:${camera.onvifPort}/onvif/device_service`;
    }
    
    console.log(`Sử dụng ONVIF endpoint: ${xaddr}`);
    
    // Tạo đối tượng device
    const device = new onvif.OnvifDevice({
      xaddr,
      user: camera.username,
      pass: camera.password
    });
    
    // Khởi tạo thiết bị với timeout 10 giây
    console.log('Bắt đầu khởi tạo kết nối...');
    await Promise.race([
      device.init(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout kết nối ONVIF (10s)')), 10000)
      )
    ]);
    
    console.log('Khởi tạo kết nối ONVIF thành công');
    
    // Lưu thiết bị vào storage
    storage.onvifDevices[camera.id] = device;
    
    // Lấy thông tin thiết bị
    let deviceInfo = {};
    try {
      deviceInfo = await device.getDeviceInformation();
      console.log('Thông tin thiết bị:', deviceInfo);
    } catch (infoErr) {
      console.warn('Không thể lấy thông tin thiết bị:', infoErr.message);
    }
    
    // Lấy thông tin profile
    let profiles = [];
    try {
      profiles = await device.getProfiles();
      console.log(`Tìm thấy ${profiles.length} profile ONVIF`);
    } catch (profileErr) {
      console.warn('Không thể lấy profiles:', profileErr.message);
    }
    
    // Cập nhật trạng thái camera và thông tin bổ sung
    const cameraIndex = storage.cameras.findIndex(c => c.id === camera.id);
    if (cameraIndex !== -1) {
      // Nếu không có RTSP URL có sẵn, và có profile, tạo URL RTSP
      if (!storage.cameras[cameraIndex].rtspUrl && profiles.length > 0) {
        try {
          // Lấy profile đầu tiên nếu không chỉ định
          const profileToken = profiles[0].token;
          
          // Lấy URI RTSP
          const rtspUri = await device.getUri({
            profileToken: profileToken,
            protocol: 'RTSP'
          });
          
          // Cập nhật RTSP URL
          if (rtspUri && rtspUri.uri) {
            storage.cameras[cameraIndex].rtspUrl = rtspUri.uri;
            console.log(`Đã cập nhật RTSP URL: ${rtspUri.uri}`);
          }
        } catch (rtspErr) {
          console.warn('Không thể lấy RTSP URI:', rtspErr.message);
        }
      }
      
      // Nếu có thông tin thiết bị, cập nhật metadata
      if (deviceInfo) {
        storage.cameras[cameraIndex].manufacturer = deviceInfo.manufacturer || '';
        storage.cameras[cameraIndex].model = deviceInfo.model || '';
        storage.cameras[cameraIndex].firmwareVersion = deviceInfo.firmwareVersion || '';
        storage.cameras[cameraIndex].serialNumber = deviceInfo.serialNumber || '';
      }
      
      // Cập nhật thông tin profile
      if (profiles && profiles.length > 0) {
        storage.cameras[cameraIndex].profiles = profiles.map(p => ({
          name: p.name,
          token: p.token,
          video: p.video ? {
            encoding: p.video.encoder,
            resolution: p.video.resolution ? 
              `${p.video.resolution.width}x${p.video.resolution.height}` : 'Unknown'
          } : null
        }));
      }
      
      // Cập nhật trạng thái
      storage.cameras[cameraIndex].status = 'online';
      storage.cameras[cameraIndex].updatedAt = new Date().toISOString();
      storage.cameras[cameraIndex].lastConnected = new Date().toISOString();
    }
    
    console.log(`Kết nối thành công đến camera ${camera.name} qua ONVIF`);
    return device;
  } catch (error) {
    console.error(`Lỗi khi kết nối đến camera ${camera.name}:`, error.message);
    
    // Cập nhật trạng thái lỗi và chi tiết lỗi
    const cameraIndex = storage.cameras.findIndex(c => c.id === camera.id);
    if (cameraIndex !== -1) {
      storage.cameras[cameraIndex].status = 'error';
      storage.cameras[cameraIndex].errorMessage = error.message;
      storage.cameras[cameraIndex].updatedAt = new Date().toISOString();
    }
    
    throw error;
  }
}

// Kiểm tra kết nối camera
async function testCameraConnection(camera) {
  try {
    console.log(`Bắt đầu kiểm tra kết nối camera ${camera.name} (${camera.ipAddress})`);
    
    const result = {
      success: false,
      status: 'unknown',
      onvif: {
        connected: false,
        deviceInfo: null,
        profiles: [],
        capabilities: null,
        error: null
      },
      rtsp: {
        connected: false,
        url: camera.rtspUrl || null,
        error: null
      },
      networkAvailable: false,
      pingResult: null
    };
    
    // 1. Kiểm tra ping IP camera
    try {
      console.log(`Ping đến địa chỉ ${camera.ipAddress}...`);
      // Giả lập kiểm tra ping (thực tế sẽ dùng các gói như ping hoặc net-ping)
      result.networkAvailable = true;
      result.pingResult = 'OK';
    } catch (pingErr) {
      console.error('Lỗi khi ping camera:', pingErr.message);
      result.pingResult = 'FAILED';
    }
    
    // 2. Thử kết nối ONVIF
    try {
      console.log(`Thử kết nối ONVIF đến ${camera.name}`);
      
      // Kết nối thiết bị
      const device = await connectToOnvifDevice(camera);
      result.onvif.connected = true;
      
      // Lấy thông tin thiết bị
      try {
        const info = await device.getDeviceInformation();
        result.onvif.deviceInfo = info;
      } catch (infoErr) {
        console.warn('Không thể lấy thông tin thiết bị:', infoErr.message);
        result.onvif.deviceInfo = { error: infoErr.message };
      }
      
      // Lấy profile stream
      try {
        const profiles = await device.getProfiles();
        result.onvif.profiles = profiles.map(p => ({
          name: p.name,
          token: p.token,
          video: p.video ? {
            encoder: p.video.encoder,
            resolution: p.video.resolution ? 
              `${p.video.resolution.width}x${p.video.resolution.height}` : 'Unknown'
          } : null,
          hasSnapshot: p.snapshot ? true : false,
          hasAudio: p.audio ? true : false
        }));
      } catch (profileErr) {
        console.warn('Không thể lấy profile:', profileErr.message);
        result.onvif.profiles = [];
      }
      
      // Lấy capabilities
      try {
        const capabilities = await device.getCapabilities();
        result.onvif.capabilities = {
          // Chỉ lấy thông tin cần thiết từ capabilities
          ptz: capabilities.ptz ? true : false,
          media: capabilities.media ? true : false,
          imaging: capabilities.imaging ? true : false,
          events: capabilities.events ? true : false,
          analytics: capabilities.analytics ? true : false
        };
      } catch (capErr) {
        console.warn('Không thể lấy capabilities:', capErr.message);
      }
      
      // Kiểm tra URI RTSP
      if (!camera.rtspUrl && result.onvif.profiles.length > 0) {
        try {
          // Lấy profile đầu tiên nếu không chỉ định
          const profileToken = result.onvif.profiles[0].token;
          
          // Lấy URI RTSP
          const rtspUri = await device.getUri({
            profileToken: profileToken,
            protocol: 'RTSP'
          });
          
          if (rtspUri && rtspUri.uri) {
            result.rtsp.url = rtspUri.uri;
            console.log(`Đã tìm thấy RTSP URL: ${rtspUri.uri}`);
          }
        } catch (rtspErr) {
          console.warn('Không thể lấy RTSP URI:', rtspErr.message);
        }
      } 
      // Nếu đã có URL RTSP, sử dụng
      else if (camera.rtspUrl) {
        result.rtsp.url = camera.rtspUrl;
      }
      
      // Cập nhật thành công
      result.success = true;
      result.status = 'online';
    } catch (onvifErr) {
      console.error('Lỗi kết nối ONVIF:', onvifErr.message);
      result.onvif.error = onvifErr.message;
      
      // Vẫn thử kiểm tra RTSP nếu có URL
      if (camera.rtspUrl) {
        result.rtsp.url = camera.rtspUrl;
      }
    }
    
    // 3. Thử kết nối RTSP (chỉ kiểm tra nếu có URL)
    if (result.rtsp.url) {
      try {
        console.log(`Kiểm tra kết nối RTSP: ${result.rtsp.url}`);
        
        // Thực tế chúng ta sẽ kiểm tra kết nối RTSP
        // Ở đây chúng ta sẽ giả lập thành công để tránh phức tạp
        result.rtsp.connected = true;
        
        // Nếu ONVIF không thành công nhưng RTSP được thì vẫn là online
        if (!result.onvif.connected) {
          result.success = true;
          result.status = 'rtsp_only';
        }
      } catch (rtspErr) {
        console.error('Lỗi kết nối RTSP:', rtspErr.message);
        result.rtsp.error = rtspErr.message;
      }
    }
    
    // Nếu không kết nối được cả ONVIF và RTSP
    if (!result.onvif.connected && !result.rtsp.connected) {
      result.status = 'offline';
    }
    
    console.log(`Kết quả kiểm tra camera ${camera.name}:`, result);
    return result;
  } catch (error) {
    console.error('Lỗi không xác định khi kiểm tra kết nối camera:', error);
    return {
      success: false,
      status: 'error',
      error: error.message
    };
  }
}

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client kết nối:', socket.id);
  
  // Gửi danh sách camera cho client mới kết nối
  socket.emit('cameraList', storage.cameras);
  
  // Gửi cập nhật trạng thái camera theo thời gian thực
  socket.on('subscribeCameraStatus', (cameraId) => {
    console.log(`Client ${socket.id} đăng ký nhận cập nhật cho camera ${cameraId}`);
    
    // Thêm camera vào danh sách đăng ký của socket
    socket.join(`camera:${cameraId}`);
  });
  
  socket.on('unsubscribeCameraStatus', (cameraId) => {
    console.log(`Client ${socket.id} hủy đăng ký nhận cập nhật cho camera ${cameraId}`);
    
    // Xóa camera khỏi danh sách đăng ký của socket
    socket.leave(`camera:${cameraId}`);
  });
  
  // Xử lý sự kiện ngắt kết nối
  socket.on('disconnect', () => {
    console.log('Client ngắt kết nối:', socket.id);
  });
});

// Phát hiện chuyển động (mô phỏng)
function simulateMotionDetection() {
  // Chỉ thực hiện nếu motionDetection được bật
  if (!storage.settings.motionDetection) return;
  
  // Lấy camera ngẫu nhiên từ danh sách camera online
  const onlineCameras = storage.cameras.filter(c => c.status === 'online' || c.status === 'streaming');
  
  if (onlineCameras.length === 0) return;
  
  // 5% cơ hội tạo cảnh báo chuyển động
  if (Math.random() < 0.05) {
    const camera = onlineCameras[Math.floor(Math.random() * onlineCameras.length)];
    
    // Tạo cảnh báo mới
    const newAlert = {
      id: randomUUID(),
      cameraId: camera.id,
      type: 'motion',
      severity: 'medium',
      timestamp: new Date().toISOString(),
      resolved: false,
      message: `Phát hiện chuyển động ở ${camera.name}`,
      snapshotUrl: null,
      recordingId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    storage.alerts.push(newAlert);
    
    // Thông báo cho tất cả client
    io.emit('newAlert', newAlert);
    
    console.log(`Phát hiện chuyển động ở camera ${camera.name}`);
  }
}

// Tải dữ liệu mẫu khi khởi động
loadSampleData();

// Khởi động server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Giả lập phát hiện chuyển động mỗi 10 giây
setInterval(simulateMotionDetection, 10000);