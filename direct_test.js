/**
 * Script để kiểm tra trực tiếp máy chủ Dahua bằng xác thực Digest
 */
const axios = require('axios');
const crypto = require('crypto');

// Thông tin kết nối
const CAMERA_HOST = 'huannv112.ddns.net';
const CAMERA_PORT = 80;
const CAMERA_USER = 'admin';
const CAMERA_PASS = 'Admin@123'; // Thử với mật khẩu phức tạp hơn

// URL cần kiểm tra
const BASE_URL = `http://${CAMERA_HOST}:${CAMERA_PORT}`;
const TEST_PATH = '/cgi-bin/configManager.cgi?action=getConfig&name=Network';

/**
 * Tạo digest auth header theo chuẩn từ phản hồi 401
 */
function createDigestAuthHeader(digestInfo, username, password, uri, method = 'GET') {
  // Parse WWW-Authenticate header từ phản hồi 401
  const { realm, nonce, opaque, qop } = parseDigestHeader(digestInfo);
  
  // Sử dụng đúng realm từ WWW-Authenticate header
  // Tạo response value theo RFC 2617
  const ha1 = crypto.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');
  const ha2 = crypto.createHash('md5').update(`${method}:${uri}`).digest('hex');
  
  let cnonce = '';
  let nc = '00000001';
  
  if (qop) {
    cnonce = crypto.randomBytes(8).toString('hex');
    nc = '00000001';
  }
  
  let responseValue;
  if (qop === 'auth') {
    responseValue = crypto.createHash('md5')
      .update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`)
      .digest('hex');
  } else {
    responseValue = crypto.createHash('md5')
      .update(`${ha1}:${nonce}:${ha2}`)
      .digest('hex');
  }
  
  // Tạo header auth
  let authHeader = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${responseValue}"`;
  
  if (opaque) {
    authHeader += `, opaque="${opaque}"`;
  }
  
  if (qop) {
    authHeader += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  }
  
  return authHeader;
}

/**
 * Parse WWW-Authenticate header để lấy các thông tin cần thiết
 */
function parseDigestHeader(digestHeader) {
  const parts = {};
  // Cải thiện regex để bắt nhiều format hơn, bao gồm cả các realm phức tạp có dấu cách
  const regex = /(\w+)=["']?([^'",]+?)["']?(?:,|$)/g;
  
  let match;
  while ((match = regex.exec(digestHeader)) !== null) {
    parts[match[1]] = match[2];
    console.log(`Parsed ${match[1]} = '${match[2]}'`); // Thêm log để debug
  }
  
  return parts;
}

/**
 * Kiểm tra xác thực với máy chủ
 */
async function testDigestAuth() {
  try {
    console.log(`Đang kiểm tra kết nối tới ${BASE_URL}${TEST_PATH}...`);
    
    // Bước 1: Lấy thông tin digest auth
    let digestInfo = null;
    try {
      // Đầu tiên gửi request không có auth để lấy thông tin Digest
      await axios.get(`${BASE_URL}${TEST_PATH}`, { timeout: 10000 });
    } catch (err) {
      if (err.response && err.response.status === 401) {
        digestInfo = err.response.headers['www-authenticate'];
        console.log('Nhận được thông tin xác thực Digest:');
        console.log(digestInfo);
      } else {
        throw err;
      }
    }
    
    if (!digestInfo) {
      throw new Error('Không nhận được thông tin Digest auth từ máy chủ');
    }
    
    // Bước 2: Tạo header auth và gửi lại request
    const authHeader = createDigestAuthHeader(digestInfo, CAMERA_USER, CAMERA_PASS, TEST_PATH);
    
    console.log('Đang gửi request với header Digest auth:');
    console.log(authHeader);
    
    const response = await axios.get(`${BASE_URL}${TEST_PATH}`, {
      headers: {
        'Authorization': authHeader
      },
      timeout: 15000
    });
    
    console.log('Kết nối thành công!');
    console.log(`Status: ${response.status}`);
    console.log('Phản hồi:');
    console.log(response.data);
    
    return true;
  } catch (error) {
    console.error('Lỗi khi kiểm tra kết nối:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('Không nhận được phản hồi');
      console.error(error.message);
    } else {
      console.error('Lỗi:', error.message);
    }
    
    return false;
  }
}

// Chạy kiểm tra xác thực
testDigestAuth()
  .then(success => {
    console.log(`Kiểm tra kết thúc với kết quả: ${success ? 'THÀNH CÔNG' : 'THẤT BẠI'}`);
  })
  .catch(err => {
    console.error('Lỗi không mong muốn:', err);
  });