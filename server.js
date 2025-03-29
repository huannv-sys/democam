require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server: WebSocketServer } = require('socket.io');
const dahua = require("./videoreg/apis/dahua");
const hikvision = require("./videoreg/apis/hikvision");
const { exec } = require('child_process');
const Stream = require('node-rtsp-stream');

const app = express();
const server = http.createServer(app);
const io = new WebSocketServer(server);
const port = 5000;

// Lưu trữ các stream đang active
const activeStreams = {};

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Tạo thư mục public nếu chưa tồn tại
if (!fs.existsSync('./public')) {
  fs.mkdirSync('./public');
}

// Tạo thư mục cho lưu trữ snapshots
if (!fs.existsSync('./public/snapshots')) {
  fs.mkdirSync('./public/snapshots');
}

// API route để kiểm tra kết nối camera
app.post('/api/check-camera', async (req, res) => {
  try {
    const { type, host, port, user, pass } = req.body;
    
    console.log(`Đang kiểm tra kết nối với camera ${type} tại ${host}...`);
    
    let camera;
    if (type === "hikvision") {
      camera = new hikvision({
        host,
        port: parseInt(port) || 80,
        user,
        pass
      });
    } else if (type === "dahua") {
      camera = new dahua({
        host,
        port: parseInt(port) || 80,
        user,
        pass
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Loại camera không được hỗ trợ. Hãy chọn 'hikvision' hoặc 'dahua'" 
      });
    }

    // Lấy thông tin thiết bị
    const deviceInfo = await camera.device_info();
    
    if (deviceInfo.status.code === 200) {
      return res.json({
        success: true,
        message: "Kết nối thành công!",
        info: deviceInfo.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Không thể kết nối đến camera: ${deviceInfo.status.desc}`,
        error: deviceInfo.status
      });
    }
  } catch (error) {
    console.error("Lỗi khi kết nối đến camera:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi kết nối đến camera",
      error: error.message
    });
  }
});

// API route để lấy snapshot từ camera
app.post('/api/snapshot', async (req, res) => {
  try {
    const { type, host, port, user, pass, channel } = req.body;
    
    console.log(`Đang lấy snapshot từ camera ${type} tại ${host}...`);
    
    let camera;
    if (type === "hikvision") {
      camera = new hikvision({
        host,
        port: parseInt(port) || 80,
        user,
        pass
      });
    } else if (type === "dahua") {
      camera = new dahua({
        host,
        port: parseInt(port) || 80,
        user,
        pass
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Loại camera không được hỗ trợ. Hãy chọn 'hikvision' hoặc 'dahua'" 
      });
    }

    try {
      // Thử nhiều định dạng kênh khác nhau
      const channelId = channel || "101"; // Default channel
      
      console.log(`Đang thử lấy ảnh với kênh ${channelId}...`);
      const image = await camera.picture(channelId);
      
      if (!image || (image instanceof Buffer && image.length === 0)) {
        throw new Error("Received empty image data");
      }
      
      // Lưu snapshot ra file với tên duy nhất
      const timestamp = new Date().getTime();
      const filename = `${type}_${host.replace(/\./g, '_')}_${timestamp}.jpg`;
      const filePath = path.join('./public/snapshots', filename);
      
      fs.writeFileSync(filePath, image);
      
      return res.json({
        success: true,
        message: "Đã lấy snapshot thành công",
        imagePath: `/snapshots/${filename}`
      });
    } catch (error) {
      console.error("Lỗi chi tiết khi lấy snapshot:", error);
      
      // Nếu thử kênh đầu tiên không thành công, thử các kênh khác
      if (channel === "101" || !channel) {
        try {
          console.log("Thử lại với kênh 1...");
          const image = await camera.picture("1");
          
          if (!image || (image instanceof Buffer && image.length === 0)) {
            throw new Error("Received empty image data");
          }
          
          // Lưu snapshot ra file
          const timestamp = new Date().getTime();
          const filename = `${type}_${host.replace(/\./g, '_')}_${timestamp}.jpg`;
          const filePath = path.join('./public/snapshots', filename);
          
          fs.writeFileSync(filePath, image);
          
          return res.json({
            success: true,
            message: "Đã lấy snapshot thành công với kênh 1",
            imagePath: `/snapshots/${filename}`
          });
        } catch (secondError) {
          console.error("Cũng không lấy được ảnh với kênh 1:", secondError);
          throw error; // Throw lỗi ban đầu
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Lỗi khi lấy snapshot từ camera:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy snapshot từ camera",
      error: error.message
    });
  }
});

// API route để bắt đầu livestream từ camera
app.post('/api/start-stream', (req, res) => {
  try {
    const { type, host, port, user, pass, channel, wsPort } = req.body;
    
    // Tạo ID cho stream dựa trên thông tin camera
    const streamId = `${type}_${host}_${channel}`;
    
    // Kiểm tra xem stream đã tồn tại chưa
    if (activeStreams[streamId]) {
      return res.json({
        success: true,
        message: "Stream đã được khởi động",
        streamId,
        wsPort: activeStreams[streamId].wsPort
      });
    }
    
    // Tạo URL RTSP dựa vào loại camera và thông tin đăng nhập
    let rtspUrl;
    if (type === "hikvision") {
      rtspUrl = `rtsp://${user}:${pass}@${host}:554/ISAPI/Streaming/channels/${channel}/`;
    } else if (type === "dahua") {
      rtspUrl = `rtsp://${user}:${pass}@${host}:554/cam/realmonitor?channel=${channel}&subtype=0`;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Loại camera không được hỗ trợ. Hãy chọn 'hikvision' hoặc 'dahua'" 
      });
    }
    
    console.log(`Bắt đầu stream từ ${rtspUrl}`);
    
    // Tạo các websocket port tăng dần (từ 9000)
    const streamWsPort = wsPort || Math.floor(9000 + Math.random() * 1000);
    
    // Khởi tạo stream
    try {
      const stream = new Stream({
        name: streamId,
        streamUrl: rtspUrl,
        wsPort: streamWsPort,
        ffmpegOptions: {
          '-stats': '',
          '-r': 30,
          '-q:v': 3
        }
      });
      
      // Lưu stream vào danh sách active
      activeStreams[streamId] = {
        stream: stream,
        wsPort: streamWsPort,
        info: { type, host, channel }
      };
      
      return res.json({
        success: true,
        message: "Đã bắt đầu stream thành công",
        streamId,
        wsPort: streamWsPort
      });
    } catch (error) {
      console.error("Lỗi khi khởi tạo stream:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi khởi tạo stream",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Lỗi khi bắt đầu stream:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi bắt đầu stream",
      error: error.message
    });
  }
});

// API route để dừng livestream
app.post('/api/stop-stream', (req, res) => {
  try {
    const { streamId } = req.body;
    
    if (!streamId || !activeStreams[streamId]) {
      return res.status(404).json({
        success: false,
        message: "Stream không tồn tại hoặc đã dừng"
      });
    }
    
    // Dừng stream
    try {
      if (activeStreams[streamId].stream) {
        activeStreams[streamId].stream.stop();
      }
      
      // Xóa khỏi danh sách active
      delete activeStreams[streamId];
      
      return res.json({
        success: true,
        message: "Đã dừng stream thành công"
      });
    } catch (error) {
      console.error("Lỗi khi dừng stream:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi dừng stream",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Lỗi khi dừng stream:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi dừng stream",
      error: error.message
    });
  }
});

// API route để lấy danh sách stream đang hoạt động
app.get('/api/active-streams', (req, res) => {
  const streams = {};
  
  for (const [id, streamData] of Object.entries(activeStreams)) {
    streams[id] = {
      wsPort: streamData.wsPort,
      info: streamData.info
    };
  }
  
  return res.json({
    success: true,
    streams
  });
});

// Serve index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Client kết nối: ' + socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client ngắt kết nối: ' + socket.id);
  });
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server đang chạy tại http://0.0.0.0:${port}`);
});