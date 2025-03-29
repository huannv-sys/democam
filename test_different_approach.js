/**
 * Test script để thử các phương pháp kết nối khác với camera Dahua
 */
require('dotenv').config();
const axios = require('axios');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execPromise = promisify(exec);

// Tăng timeout cho toàn bộ script
http.globalAgent.maxSockets = 100;
https.globalAgent.maxSockets = 100;
http.globalAgent.keepAlive = true;
https.globalAgent.keepAlive = true;
http.globalAgent.options.timeout = 30000;
https.globalAgent.options.timeout = 30000;

// Các thông tin kết nối camera
const CAMERA_HOST = 'huannv112.ddns.net';
const CAMERA_USER = 'admin';
const CAMERA_PASS = 'admin123';
const CAMERA_PORT = 80;
const RTSP_PORT = 554;

// Tạo Basic Auth
const BASIC_AUTH = Buffer.from(`${CAMERA_USER}:${CAMERA_PASS}`).toString('base64');

// Định dạng URL cơ bản
const HTTP_URL = `http://${CAMERA_HOST}:${CAMERA_PORT}`;
const RTSP_URL = `rtsp://${CAMERA_USER}:${CAMERA_PASS}@${CAMERA_HOST}:${RTSP_PORT}`;

/**
 * Test HTTP connection - kiểm tra kết nối HTTP cơ bản
 */
async function testHttpConnection() {
  console.log('\n========== KIỂM TRA KẾT NỐI HTTP ==========');
  
  try {
    console.log(`Đang kết nối đến ${HTTP_URL}...`);
    const response = await axios.get(HTTP_URL, {
      timeout: 10000
    });
    
    console.log('Kết nối HTTP thành công!');
    console.log(`Status: ${response.status}`);
    console.log(`Tiêu đề: ${response.headers['content-type']}`);
    console.log(`Kích thước phản hồi: ${response.data.length} bytes`);
  } catch (error) {
    console.error('Lỗi kết nối HTTP:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('Không nhận được phản hồi');
      console.error(error.message);
    } else {
      console.error('Lỗi cấu hình request:', error.message);
    }
  }
}

/**
 * Test các snapshot URL khác nhau
 */
async function testSnapshotUrls() {
  console.log('\n========== KIỂM TRA SNAPSHOT URLS ==========');
  
  // Danh sách các đường dẫn snapshot cần kiểm tra
  const snapshotPaths = [
    '/cgi-bin/snapshot.cgi?channel=1',
    '/cgi-bin/getSnapshot.cgi?channel=1',
    '/snapshot.cgi?channel=1',
    '/cgi-bin/image.cgi?channel=1',
    '/onvif-http/snapshot?channel=1',
    '/ISAPI/Streaming/channels/1/picture',
    '/ISAPI/Streaming/channels/101/picture',
    '/webcapture.jpg?channel=1',
    '/cgi-bin/jpeg/channel1',
    '/cgi-bin/snapshot.cgi', // Không có tham số kênh
    '/snapshot.cgi', // Không có tham số kênh
    '/cgi-bin/snapManager.cgi?action=attachFileProc&channel=1',
    '/cgi-bin/mjpg/snapshot.cgi?chn=1',
    '/cgi-bin/mjpg/video.cgi?channel=1&subtype=1',
    '/cgi-bin/snapshot.jpg?channel=1'
  ];
  
  // Tạo thư mục để lưu các snapshot
  const snapshotDir = path.join(__dirname, 'snapshots');
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir);
  }
  
  // Kiểm tra từng URL
  let successCount = 0;
  
  for (const [index, snapPath] of snapshotPaths.entries()) {
    console.log(`\nKiểm tra URL ${index + 1}/${snapshotPaths.length}: ${snapPath}`);
    
    try {
      // Thử với Basic Auth
      const response = await axios.get(`${HTTP_URL}${snapPath}`, {
        headers: {
          'Authorization': `Basic ${BASIC_AUTH}`,
          'Accept': 'image/jpeg,image/*;q=0.8',
          'Cache-Control': 'no-cache'
        },
        responseType: 'arraybuffer',
        timeout: 15000
      });
      
      // Kiểm tra phản hồi
      if (response.data && 
          response.data.length > 100 && 
          response.headers['content-type'] && 
          response.headers['content-type'].includes('image')) {
        
        console.log(`✅ SUCCESS: ${snapPath}`);
        console.log(`  Content-Type: ${response.headers['content-type']}`);
        console.log(`  Kích thước: ${response.data.length} bytes`);
        
        // Lưu ảnh
        const filename = `snapshot_${index+1}_${Date.now()}.jpg`;
        const filepath = path.join(snapshotDir, filename);
        fs.writeFileSync(filepath, response.data);
        console.log(`  Đã lưu tại: ${filepath}`);
        
        successCount++;
      } else {
        console.log(`❌ FAILED: ${snapPath}`);
        console.log(`  Phản hồi không phải ảnh`);
        console.log(`  Content-Type: ${response.headers['content-type']}`);
        console.log(`  Kích thước: ${response.data.length} bytes`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${snapPath}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
      } else {
        console.log(`  Lỗi: ${error.message}`);
      }
    }
  }
  
  console.log(`\nTổng số URL thành công: ${successCount}/${snapshotPaths.length}`);
}

/**
 * Test RTSP URLs
 */
async function testRtspUrls() {
  console.log('\n========== KIỂM TRA RTSP URLS ==========');
  
  // Khởi tạo danh sách các RTSP URL cần kiểm tra
  const rtspUrls = [
    // Định dạng phổ biến
    `${RTSP_URL}/cam/realmonitor?channel=1&subtype=0`,
    `${RTSP_URL}/cam/realmonitor?channel=1&subtype=1`,
    `${RTSP_URL}/cam/realmonitor?channel=2&subtype=0`,
    // Định dạng thay thế
    `${RTSP_URL}/h264/ch1/0/av_stream`,
    `${RTSP_URL}/h264/ch1/1/av_stream`,
    `${RTSP_URL}/live/ch1/0`,
    `${RTSP_URL}/live/ch1/1`,
    // Định dạng Onvif
    `${RTSP_URL}/streaming/channels/101`,
    `${RTSP_URL}/streaming/channels/102`,
    `${RTSP_URL}/onvif1`,
    `${RTSP_URL}/Streaming/Channels/101`,
    `${RTSP_URL}/Streaming/Channels/102`,
    // Định dạng đơn giản
    `${RTSP_URL}/stream1`,
    `${RTSP_URL}/ch1_0`,
    `${RTSP_URL}/ch1_1`,
    // Cổng khác
    `rtsp://${CAMERA_USER}:${CAMERA_PASS}@${CAMERA_HOST}:1554/cam/realmonitor?channel=1&subtype=0`,
    `rtsp://${CAMERA_USER}:${CAMERA_PASS}@${CAMERA_HOST}:10554/cam/realmonitor?channel=1&subtype=0`,
    // Thử không có thông tin xác thực
    `rtsp://${CAMERA_HOST}:${RTSP_PORT}/cam/realmonitor?channel=1&subtype=0`
  ];
  
  for (const [index, rtspUrl] of rtspUrls.entries()) {
    console.log(`\nKiểm tra RTSP URL ${index + 1}/${rtspUrls.length}: ${rtspUrl}`);
    
    try {
      // Sử dụng ffprobe để kiểm tra RTSP stream
      const command = `timeout 10 ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name -of csv=p=0 "${rtspUrl}"`;
      console.log(`Đang chạy lệnh: ${command}`);
      
      const { stdout, stderr } = await execPromise(command);
      
      if (stdout && stdout.trim()) {
        console.log(`✅ SUCCESS: ${rtspUrl}`);
        console.log(`  Thông tin stream: ${stdout.trim()}`);
      } else {
        console.log(`❌ FAILED: ${rtspUrl}`);
        if (stderr) console.log(`  Stderr: ${stderr}`);
      }
    } catch (error) {
      console.log(`❌ ERROR: ${rtspUrl}`);
      console.log(`  Lỗi: ${error.message}`);
    }
  }
}

/**
 * Test thông tin thiết bị
 */
async function testDeviceInfo() {
  console.log('\n========== KIỂM TRA THÔNG TIN THIẾT BỊ ==========');
  
  const deviceInfoPaths = [
    '/cgi-bin/magicBox.cgi?action=getDeviceType',
    '/cgi-bin/magicBox.cgi?action=getHardwareVersion',
    '/cgi-bin/magicBox.cgi?action=getSoftwareVersion',
    '/cgi-bin/magicBox.cgi?action=getSerialNo',
    '/cgi-bin/configManager.cgi?action=getConfig&name=Network'
  ];
  
  for (const [index, infoPath] of deviceInfoPaths.entries()) {
    console.log(`\nKiểm tra API ${index + 1}/${deviceInfoPaths.length}: ${infoPath}`);
    
    try {
      // Thử với Basic Auth
      const response = await axios.get(`${HTTP_URL}${infoPath}`, {
        headers: {
          'Authorization': `Basic ${BASIC_AUTH}`,
          'Accept': 'text/plain,*/*'
        },
        timeout: 15000
      });
      
      console.log(`✅ SUCCESS: ${infoPath}`);
      console.log(`  Phản hồi: ${response.data}`);
    } catch (error) {
      console.log(`❌ ERROR: ${infoPath}`);
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        console.log(`  Data: ${error.response.data}`);
      } else {
        console.log(`  Lỗi: ${error.message}`);
      }
    }
  }
}

/**
 * Main function để chạy tất cả các kiểm tra
 */
async function runAllTests() {
  console.log('===== BẮT ĐẦU KIỂM TRA TOÀN DIỆN =====');
  console.log(`Camera: ${CAMERA_HOST}:${CAMERA_PORT}`);
  console.log(`Người dùng: ${CAMERA_USER}`);
  console.log(`Thời gian: ${new Date().toLocaleString()}`);
  
  // Chạy các bài kiểm tra
  try {
    await testHttpConnection();
    await testSnapshotUrls();
    await testRtspUrls();
    await testDeviceInfo();
    
    console.log('\n===== HOÀN TẤT KIỂM TRA =====');
    console.log(`Thời gian kết thúc: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error('Lỗi khi chạy bài kiểm tra:', error);
  }
}

// Chạy tất cả các kiểm tra
runAllTests().catch(console.error);