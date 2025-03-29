/**
 * Script đơn giản để kiểm tra vấn đề kết nối mạng với camera
 */
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Thông tin kết nối camera
const CAMERA_HOST = 'huannv112.ddns.net';
const CAMERA_USER = 'admin';
const CAMERA_PASS = 'Admin@123'; // Thử với mật khẩu phức tạp hơn
const CAMERA_PORT = 80;
const RTSP_PORT = 554;

// Máy chủ tuyệt đối đáng tin cậy để kiểm tra khả năng kết nối internet
const RELIABLE_HOST = 'google.com';

// Tạo Basic Auth token
const BASIC_AUTH = Buffer.from(`${CAMERA_USER}:${CAMERA_PASS}`).toString('base64');

/**
 * Kiểm tra kết nối internet cơ bản
 */
async function testInternetConnectivity() {
  console.log('\n========== KIỂM TRA KẾT NỐI INTERNET ==========');
  
  try {
    // Kiểm tra kết nối đến máy chủ đáng tin cậy
    console.log(`Đang kiểm tra kết nối đến ${RELIABLE_HOST}...`);
    await execAsync(`ping -c 3 ${RELIABLE_HOST}`);
    console.log(`✅ Có thể ping đến ${RELIABLE_HOST}`);
  } catch (error) {
    console.error(`❌ Không thể ping đến ${RELIABLE_HOST}`);
    console.error(`Chi tiết lỗi: ${error.message}`);
  }
  
  try {
    console.log(`Đang kiểm tra kết nối HTTP đến ${RELIABLE_HOST}...`);
    const response = await axios.get(`https://${RELIABLE_HOST}`, {
      timeout: 5000
    });
    console.log(`✅ Kết nối HTTP thành công đến ${RELIABLE_HOST} (status: ${response.status})`);
  } catch (error) {
    console.error(`❌ Không thể kết nối HTTP đến ${RELIABLE_HOST}`);
    console.error(`Chi tiết lỗi: ${error.message}`);
  }
}

/**
 * Kiểm tra khả năng phân giải DNS cho camera host
 */
async function testDnsResolution() {
  console.log('\n========== KIỂM TRA PHÂN GIẢI DNS ==========');
  
  try {
    console.log(`Đang phân giải DNS cho ${CAMERA_HOST}...`);
    const { stdout } = await execAsync(`dig +short ${CAMERA_HOST} || nslookup ${CAMERA_HOST} || host ${CAMERA_HOST}`);
    
    if (stdout && stdout.trim()) {
      console.log(`✅ Phân giải DNS thành công: ${CAMERA_HOST} -> ${stdout.trim()}`);
    } else {
      console.error(`❌ Không thể phân giải DNS cho ${CAMERA_HOST}`);
    }
  } catch (error) {
    console.error(`❌ Lỗi khi phân giải DNS cho ${CAMERA_HOST}`);
    console.error(`Chi tiết lỗi: ${error.message}`);
  }
}

/**
 * Kiểm tra kết nối TCP đến các cổng cụ thể của camera
 */
async function testTcpPorts() {
  console.log('\n========== KIỂM TRA KẾT NỐI CÁC CỔNG TCP ==========');
  
  // Danh sách các cổng cần kiểm tra
  const portsToCheck = [80, 443, 554, 1554, 10554, 8000, 8080, 37777, 37778];
  
  for (const port of portsToCheck) {
    try {
      console.log(`Đang kiểm tra cổng ${port} trên ${CAMERA_HOST}...`);
      await execAsync(`nc -z -w 5 ${CAMERA_HOST} ${port} || timeout 5 telnet ${CAMERA_HOST} ${port} || timeout 5 curl -s ${CAMERA_HOST}:${port}`);
      console.log(`✅ Cổng ${port} đang mở`);
    } catch (error) {
      console.error(`❌ Không thể kết nối đến cổng ${port}`);
    }
  }
}

/**
 * Kiểm tra kết nối HTTP cơ bản
 */
async function testHttpConnection() {
  console.log('\n========== KIỂM TRA KẾT NỐI HTTP CƠ BẢN ==========');
  
  try {
    console.log(`Đang kết nối đến http://${CAMERA_HOST}:${CAMERA_PORT}...`);
    const response = await axios.get(`http://${CAMERA_HOST}:${CAMERA_PORT}`, {
      timeout: 10000,
      validateStatus: status => true // Chấp nhận mọi mã trạng thái
    });
    
    console.log(`✅ Kết nối HTTP thành công!`);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    
    // Lưu nội dung phản hồi để phân tích
    if (response.data) {
      const responseFile = path.join(__dirname, 'http_response.html');
      fs.writeFileSync(responseFile, typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
      console.log(`Đã lưu phản hồi vào: ${responseFile}`);
    }
  } catch (error) {
    console.error('❌ Lỗi kết nối HTTP:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
    } else if (error.request) {
      console.error('Không nhận được phản hồi');
      console.error(error.message);
    } else {
      console.error('Lỗi cấu hình request:', error.message);
    }
  }
}

/**
 * Test xác thực cơ bản với API đơn giản
 */
async function testBasicAuthentication() {
  console.log('\n========== KIỂM TRA XÁC THỰC CƠ BẢN ==========');
  
  // Một API endpoint đơn giản để kiểm tra xác thực
  const testEndpoints = [
    '/cgi-bin/magicBox.cgi?action=getDeviceType',
    '/cgi-bin/global.cgi?action=getCurrentTime',
    '/cgi-bin/configManager.cgi?action=getConfig&name=Network'
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`\nĐang kiểm tra ${endpoint} với xác thực cơ bản...`);
      
      const response = await axios.get(`http://${CAMERA_HOST}:${CAMERA_PORT}${endpoint}`, {
        headers: {
          'Authorization': `Basic ${BASIC_AUTH}`
        },
        timeout: 10000,
        validateStatus: status => true // Chấp nhận mọi mã trạng thái
      });
      
      console.log(`Status: ${response.status}`);
      if (response.status === 200) {
        console.log(`✅ Xác thực thành công!`);
        console.log(`Phản hồi: ${response.data}`);
      } else if (response.status === 401) {
        console.error(`❌ Xác thực thất bại (401 Unauthorized)`);
      } else {
        console.log(`⚠️ Phản hồi với status: ${response.status}`);
        console.log(`Phản hồi: ${response.data}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi khi kiểm tra xác thực:`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error(`Phản hồi: ${JSON.stringify(error.response.data)}`);
      } else {
        console.error(`Lỗi: ${error.message}`);
      }
    }
  }
}

/**
 * Thực hiện kiểm tra toàn diện
 */
async function runCompletenessCheck() {
  console.log('===== BẮT ĐẦU KIỂM TRA TOÀN DIỆN KHÁNG LỖI =====');
  console.log(`Camera: ${CAMERA_HOST}:${CAMERA_PORT}`);
  console.log(`Người dùng: ${CAMERA_USER}`);
  console.log(`Thời gian: ${new Date().toLocaleString()}`);
  
  // Chạy tất cả các kiểm tra
  await testInternetConnectivity();
  await testDnsResolution();
  await testTcpPorts();
  await testHttpConnection();
  await testBasicAuthentication();
  
  console.log('\n===== HOÀN TẤT KIỂM TRA =====');
}

// Chạy chương trình
runCompletenessCheck().catch(console.error);