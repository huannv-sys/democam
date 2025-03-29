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
const ffmpegStatic = require('ffmpeg-static');

// Thêm utils mới cho Dahua camera 
const { DahuaApi } = require('./utils/DahuaApi.js');

const app = express();
const server = http.createServer(app);
const io = new WebSocketServer(server);
const port = 5000;

// Đường dẫn đến ffmpeg
const ffmpegPath = '/nix/store/3zc5jbvqzrn8zmva4fx5p0nh4yy03wk4-ffmpeg-6.1.1-bin/bin/ffmpeg';
console.log('FFMPEG path:', ffmpegPath);

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
    
    if (!host || !user || !pass) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin kết nối. Vui lòng cung cấp địa chỉ host, tên người dùng và mật khẩu."
      });
    }
    
    let camera;
    if (type === "hikvision") {
      camera = new hikvision({
        host,
        port: parseInt(port) || 80,
        user,
        pass,
        timeout: 15000 // Giảm timeout để kiểm tra nhanh hơn
      });
    } else if (type === "dahua") {
      camera = new dahua({
        host,
        port: parseInt(port) || 80,
        user,
        pass,
        timeout: 15000 // Giảm timeout để kiểm tra nhanh hơn
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Loại camera không được hỗ trợ. Hãy chọn 'hikvision' hoặc 'dahua'" 
      });
    }

    // Lấy thông tin thiết bị với xử lý lỗi chi tiết hơn
    try {
      const deviceInfo = await camera.device_info();
      
      if (deviceInfo.status.code === 200) {
        return res.json({
          success: true,
          message: "Kết nối thành công!",
          info: deviceInfo.data
        });
      } else {
        let errorMessage = "Không thể kết nối đến camera";
        if (deviceInfo.status.desc) {
          if (deviceInfo.status.desc.includes("ECONNREFUSED")) {
            errorMessage = "Máy chủ từ chối kết nối. Vui lòng kiểm tra địa chỉ và cổng kết nối.";
          } else if (deviceInfo.status.desc.includes("ETIMEDOUT")) {
            errorMessage = "Kết nối bị timeout. Kiểm tra lại địa chỉ và cổng của camera.";
          } else if (deviceInfo.status.desc.includes("ENOTFOUND")) {
            errorMessage = "Không tìm thấy địa chỉ máy chủ. Vui lòng kiểm tra lại tên miền hoặc địa chỉ IP.";
          } else {
            errorMessage = `${errorMessage}: ${deviceInfo.status.desc}`;
          }
        }
        
        return res.status(400).json({
          success: false,
          message: errorMessage,
          error: deviceInfo.status
        });
      }
    } catch (cameraError) {
      console.error("Lỗi chi tiết khi kết nối đến camera:", cameraError);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi kết nối đến camera: " + (cameraError.message || "Lỗi không xác định"),
        error: cameraError.message
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
    
    if (!host || !user || !pass) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin kết nối. Vui lòng cung cấp địa chỉ host, tên người dùng và mật khẩu."
      });
    }
    
    if (type === "hikvision") {
      // Sử dụng API cũ cho Hikvision
      const camera = new hikvision({
        host,
        port: parseInt(port) || 80,
        user,
        pass,
        timeout: 15000 // Giảm timeout để kiểm tra nhanh hơn
      });

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
        throw error;
      }
    } else if (type === "dahua") {
      // Sử dụng API mới DahuaApi cho Dahua cameras
      try {
        // Khởi tạo API mới
        const dahuaApi = new DahuaApi({
          host,
          port: parseInt(port) || 80,
          username: user,
          password: pass,
          timeout: 15000
        });
        
        // Thử lấy snapshot với API mới và nhiều phương thức khác nhau
        const channelNum = parseInt(channel) || 1;
        console.log(`Thử lấy snapshot cho kênh ${channelNum}`);
        
        const image = await dahuaApi.getSnapshot(channelNum);
        
        if (!image || image.length < 100) {
          throw new Error("Received invalid or empty image data");
        }
        
        // Lưu snapshot ra file với tên duy nhất
        const timestamp = new Date().getTime();
        const filename = `${type}_${host.replace(/\./g, '_')}_${timestamp}.jpg`;
        const filePath = path.join('./public/snapshots', filename);
        
        fs.writeFileSync(filePath, image);
        
        return res.json({
          success: true,
          message: "Đã lấy snapshot thành công với API mới",
          imagePath: `/snapshots/${filename}`
        });
      } catch (apiError) {
        console.error("Lỗi khi lấy snapshot với API mới:", apiError);
        
        // Nếu API mới thất bại, thử lại với API cũ
        try {
          console.log("Thử lại với API cũ...");
          const oldCamera = new dahua({
            host,
            port: parseInt(port) || 80,
            user,
            pass,
            timeout: 15000
          });
          
          // Thử nhiều định dạng kênh khác nhau
          const channelId = channel || "1";
          const image = await oldCamera.picture(channelId);
          
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
            message: "Đã lấy snapshot thành công với API cũ",
            imagePath: `/snapshots/${filename}`
          });
        } catch (oldApiError) {
          console.error("Cũng không thể lấy snapshot với API cũ:", oldApiError);
          throw apiError; // Throw lỗi ban đầu
        }
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Loại camera không được hỗ trợ. Hãy chọn 'hikvision' hoặc 'dahua'" 
      });
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
    
    // Kiểm tra thông tin đầu vào
    if (!host || !user || !pass) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin kết nối. Vui lòng cung cấp địa chỉ host, tên người dùng và mật khẩu."
      });
    }
    
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
      // Xử lý định dạng kênh cho Dahua
      let channelNumber = "1";
      let subtype = "0"; // 0 = main stream, 1 = sub stream
      
      if (channel === "1") {
        // Kênh cơ bản
        channelNumber = "1";
        subtype = "0";
      } else if (channel === "101") {
        // Kênh 1, luồng chính
        channelNumber = "1";
        subtype = "0";
      } else if (channel === "102") {
        // Kênh 1, luồng phụ
        channelNumber = "1";
        subtype = "1";
      } else if (channel === "201") {
        // Kênh 2, luồng chính
        channelNumber = "2";
        subtype = "0";
      } else if (channel === "202") {
        // Kênh 2, luồng phụ
        channelNumber = "2";
        subtype = "1";
      } else {
        // Mặc định là kênh 1, luồng chính
        console.log(`Không nhận diện được định dạng kênh: ${channel}, sử dụng mặc định (kênh 1)`);
        channelNumber = "1";
        subtype = "0";
      }
      
      // Các URL RTSP cho Dahua
      const rtspUrls = [
        // Định dạng đã biết hoạt động với Dahua
        `rtsp://${user}:${pass}@${host}:554/cam/realmonitor?channel=${channelNumber}&subtype=${subtype}`,
        
        // Định dạng thay thế đã biết
        `rtsp://${user}:${pass}@${host}:554/h264/ch${channelNumber}/${subtype}/av_stream`,
        
        // Các định dạng mới tìm được từ DAHUA-ANPR repo
        `rtsp://${user}:${pass}@${host}:554/live/ch${channelNumber}/${subtype}`,
        `rtsp://${user}:${pass}@${host}:554/streaming/channels/${channelNumber}${subtype === "1" ? "02" : "01"}`,
        
        // Các định dạng ONVIF tiêu chuẩn
        `rtsp://${user}:${pass}@${host}:554/onvif${channelNumber}`,
        `rtsp://${user}:${pass}@${host}:554/media/video${channelNumber}`,
        `rtsp://${user}:${pass}@${host}:554/Streaming/Channels/${channelNumber}${subtype === "1" ? "02" : "01"}`,
        
        // Các định dạng đơn giản
        `rtsp://${user}:${pass}@${host}:554/stream${channelNumber}`,
        `rtsp://${user}:${pass}@${host}:554/ch${channelNumber}_${subtype}`
      ];
      
      // Sử dụng URL đầu tiên làm mặc định
      rtspUrl = rtspUrls[0];
      console.log(`Đã tạo URL RTSP chính cho Dahua: ${rtspUrl}`);
      console.log(`URL RTSP dự phòng: ${rtspUrls[1]}`);
      console.log(`Tổng cộng ${rtspUrls.length} URL RTSP để thử`);
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
      // Thử khởi tạo stream với URL đầu tiên
      let stream;
      let startError;
      
      try {
        console.log('Khởi tạo stream với URL: ' + rtspUrl);
        stream = new Stream({
          name: streamId,
          streamUrl: rtspUrl,
          wsPort: streamWsPort,
          ffmpegPath: ffmpegPath,
          ffmpegOptions: {
            '-stats': '',
            '-r': 10,  // Giảm framerate để ổn định hơn
            '-q:v': 10,  // Giảm chất lượng để truyền dễ hơn
            '-rtsp_transport': 'tcp',  // Sử dụng TCP thay vì UDP để truyền dữ liệu ổn định hơn
            '-analyzeduration': '15000000',  // Tăng thời gian phân tích
            '-probesize': '15000000',    // Tăng kích thước probe
            '-threads': '2'             // Giới hạn số luồng CPU
          }
        });
      } catch (error) {
        startError = error;
        console.error("Lỗi khi khởi tạo stream với URL chính:", error);
        
        // Nếu lỗi và là camera Dahua, thử tất cả các URL dự phòng
        if (type === "dahua") {
          let success = false;
          
          // Lặp qua tất cả các URL dự phòng (bỏ qua URL đầu tiên vì đã thử)
          for (let i = 1; i < rtspUrls.length; i++) {
            try {
              const backupRtspUrl = rtspUrls[i];
              console.log(`Thử với URL dự phòng ${i}: ${backupRtspUrl}`);
              
              stream = new Stream({
                name: streamId,
                streamUrl: backupRtspUrl,
                wsPort: streamWsPort,
                ffmpegPath: ffmpegPath,
                ffmpegOptions: {
                  '-stats': '',
                  '-r': 5,                    // Giảm framerate xuống rất thấp
                  '-q:v': 15,                 // Chất lượng rất thấp để đảm bảo kết nối
                  '-rtsp_transport': 'tcp',   // Sử dụng TCP 
                  '-analyzeduration': '20000000',
                  '-probesize': '20000000',
                  '-threads': '1'             // Chỉ sử dụng 1 luồng CPU
                }
              });
              
              // Nếu không lỗi thì cập nhật URL đang sử dụng và thoát khỏi vòng lặp
              rtspUrl = backupRtspUrl;
              success = true;
              console.log(`Đã khởi tạo stream thành công với URL: ${rtspUrl}`);
              break;
            } catch (backupError) {
              console.error(`Lỗi với URL dự phòng ${i}:`, backupError.message);
              // Tiếp tục thử URL tiếp theo
            }
          }
          
          // Nếu không có URL nào thành công
          if (!success) {
            console.error("Tất cả các URL RTSP đều thất bại");
            throw startError; // Ném lỗi ban đầu
          }
        } else {
          throw error;
        }
      }
      
      // Lưu stream vào danh sách active
      activeStreams[streamId] = {
        stream: stream,
        wsPort: streamWsPort,
        info: { type, host, channel }
      };
      
      // Emit stream started event
      io.emit('stream-started', {
        streamId,
        wsPort: streamWsPort,
        info: { type, host, channel }
      });
      
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
      
      // Lưu thông tin stream trước khi xóa
      const streamInfo = activeStreams[streamId].info;
      
      // Xóa khỏi danh sách active
      delete activeStreams[streamId];
      
      // Emit stream stopped event
      io.emit('stream-stopped', {
        streamId,
        info: streamInfo
      });
      
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

// Serve dashboard page
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve camera view page
app.get('/view.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Client kết nối: ' + socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client ngắt kết nối: ' + socket.id);
  });
  
  // Camera status change events
  socket.on('check-camera', async (data) => {
    try {
      const { cameraId, type, host, port, user, pass } = data;
      
      if (!host || !user || !pass) {
        socket.emit('camera-status', {
          cameraId,
          status: 'error',
          message: "Thiếu thông tin kết nối. Vui lòng cung cấp địa chỉ host, tên người dùng và mật khẩu."
        });
        return;
      }
      
      let camera;
      if (type === "hikvision") {
        camera = new hikvision({
          host,
          port: parseInt(port) || 80,
          user,
          pass,
          timeout: 15000 // Giảm timeout để kiểm tra nhanh hơn
        });
      } else if (type === "dahua") {
        camera = new dahua({
          host,
          port: parseInt(port) || 80,
          user,
          pass,
          timeout: 15000 // Giảm timeout để kiểm tra nhanh hơn
        });
      } else {
        socket.emit('camera-status', { 
          cameraId,
          status: 'error',
          message: "Loại camera không được hỗ trợ" 
        });
        return;
      }
      
      try {
        // Lấy thông tin thiết bị
        const deviceInfo = await camera.device_info();
      
        if (deviceInfo.status.code === 200) {
          socket.emit('camera-status', {
            cameraId,
            status: 'online',
            message: "Kết nối thành công",
            info: deviceInfo.data
          });
        } else {
          let errorMessage = "Không thể kết nối đến camera";
          if (deviceInfo.status.desc) {
            if (deviceInfo.status.desc.includes("ECONNREFUSED")) {
              errorMessage = "Máy chủ từ chối kết nối. Vui lòng kiểm tra địa chỉ và cổng kết nối.";
            } else if (deviceInfo.status.desc.includes("ETIMEDOUT")) {
              errorMessage = "Kết nối bị timeout. Kiểm tra lại địa chỉ và cổng của camera.";
            } else if (deviceInfo.status.desc.includes("ENOTFOUND")) {
              errorMessage = "Không tìm thấy địa chỉ máy chủ. Vui lòng kiểm tra lại tên miền hoặc địa chỉ IP.";
            } else {
              errorMessage = `${errorMessage}: ${deviceInfo.status.desc}`;
            }
          }
          
          socket.emit('camera-status', {
            cameraId,
            status: 'offline',
            message: errorMessage,
            error: deviceInfo.status
          });
        }
      } catch (deviceError) {
        console.error("Lỗi chi tiết khi kết nối đến camera:", deviceError);
        socket.emit('camera-status', {
          cameraId,
          status: 'error',
          message: "Lỗi khi kết nối đến camera: " + (deviceError.message || "Lỗi không xác định")
        });
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra camera:", error);
      socket.emit('camera-status', {
        cameraId: data.cameraId,
        status: 'error',
        message: "Lỗi khi kết nối đến camera: " + error.message
      });
    }
  });
  
  // Streaming events
  socket.on('stream-started', (data) => {
    // Broadcast to all clients
    io.emit('stream-started', data);
  });
  
  socket.on('stream-stopped', (data) => {
    // Broadcast to all clients
    io.emit('stream-stopped', data);
  });
});

// Cấu hình global để tăng timeout cho các requests
require('https').globalAgent.options.timeout = 15000;
require('http').globalAgent.options.timeout = 15000;

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Server đang chạy tại http://0.0.0.0:${port}`);
});