require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const dahua = require("./videoreg/apis/dahua");
const hikvision = require("./videoreg/apis/hikvision");

const app = express();
const port = 5000;

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

    // Lấy snapshot
    const channelId = channel || "101"; // Default channel
    const image = await camera.picture(channelId);
    
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
    console.error("Lỗi khi lấy snapshot từ camera:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy snapshot từ camera",
      error: error.message
    });
  }
});

// Serve index page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server đang chạy tại http://0.0.0.0:${port}`);
});