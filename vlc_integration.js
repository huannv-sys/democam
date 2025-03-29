/**
 * Module để kết nối camera qua VLC
 * Hỗ trợ xem trực tiếp từ camera qua VLC
 */
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Tạo kết nối VLC đến camera
 * @param {string} rtspUrl - URL RTSP của camera
 * @param {number} httpPort - Cổng HTTP cho stream VLC (mặc định: 8081)
 * @returns {Promise<object>} - Thông tin về stream VLC
 */
async function startVlcStream(rtspUrl, httpPort = 8081) {
  console.log(`Bắt đầu stream VLC cho ${rtspUrl} trên cổng HTTP ${httpPort}`);
  
  try {
    // Kiểm tra VLC đã được cài đặt
    await execAsync('which vlc || (echo "VLC not found" && exit 1)');
    
    // Tạo thư mục logs nếu chưa tồn tại
    const logDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    
    // Tạo command để chạy VLC
    const logFile = path.join(logDir, `vlc_stream_${httpPort}.log`);
    
    // Xây dựng lệnh VLC với các tùy chọn để tối ưu hóa hiệu suất
    // và giảm độ trễ trong khi stream
    const vlcCommand = `cvlc ${rtspUrl} --no-video-title-show --live-caching=300 ` +
                       `--network-caching=300 --sout "#transcode{vcodec=h264,acodec=none,fps=15,scale=auto}:` +
                       `http{mux=ts,dst=:${httpPort}/stream.ts}" --sout-keep ` +
                       `--daemon > ${logFile} 2>&1`;
    
    console.log(`Chạy lệnh VLC: ${vlcCommand}`);
    await execAsync(vlcCommand);
    
    return {
      success: true,
      rtspUrl,
      httpUrl: `http://localhost:${httpPort}/stream.ts`,
      publicUrl: `http://0.0.0.0:${httpPort}/stream.ts`,
      port: httpPort,
      logFile
    };
  } catch (error) {
    console.error('Lỗi khi khởi động VLC stream:', error.message);
    return {
      success: false,
      error: error.message,
      rtspUrl
    };
  }
}

/**
 * Dừng stream VLC
 * @param {number} httpPort - Cổng HTTP của stream VLC
 */
async function stopVlcStream(httpPort) {
  try {
    const { stdout } = await execAsync(`ps aux | grep "http{mux=ts,dst=:${httpPort}" | grep -v grep | awk '{print $2}'`);
    const pid = stdout.trim();
    
    if (pid) {
      console.log(`Dừng VLC stream trên cổng ${httpPort} (PID: ${pid})`);
      await execAsync(`kill ${pid}`);
      return { success: true, message: `Đã dừng stream VLC trên cổng ${httpPort}` };
    } else {
      return { success: false, message: `Không tìm thấy process VLC đang chạy trên cổng ${httpPort}` };
    }
  } catch (error) {
    console.error('Lỗi khi dừng VLC stream:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Kiểm tra trạng thái của stream VLC
 * @param {number} httpPort - Cổng HTTP của stream VLC
 */
async function checkVlcStreamStatus(httpPort) {
  try {
    const { stdout } = await execAsync(`ps aux | grep "http{mux=ts,dst=:${httpPort}" | grep -v grep`);
    return {
      running: stdout.trim().length > 0,
      port: httpPort
    };
  } catch (error) {
    return {
      running: false,
      error: error.message,
      port: httpPort
    };
  }
}

/**
 * Kết nối với port 37777 để thử phương thức xác thực thay thế
 * @param {string} host - IP hoặc hostname của camera
 * @param {string} username - Tên người dùng
 * @param {string} password - Mật khẩu
 */
async function connectDahuaPort37777(host, username, password) {
  try {
    // Tạo thư mục test nếu chưa tồn tại
    const testDir = path.join(__dirname, 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    
    // Tạo script tạm thời để kiểm tra kết nối
    const testScript = path.join(testDir, 'dahua_37777_test.js');
    
    const scriptContent = `
const net = require('net');

// Thông tin kết nối
const host = '${host}';
const port = 37777;
const username = '${username}';
const password = '${password}';

// Tạo request đầu tiên (dựa theo file mã khai thác)
const initialPacket = Buffer.from([
  0xa1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

const client = new net.Socket();

client.connect(port, host, () => {
  console.log(\`Đã kết nối đến \${host}:\${port}\`);
  client.write(initialPacket);
});

client.on('data', (data) => {
  console.log('Nhận được dữ liệu:');
  console.log(data);
  console.log(\`Dạng hex: \${data.toString('hex')}\`);
  
  // Kiểm tra phản hồi
  if (data.length >= 8 && data.toString('hex', 0, 8) === 'b1000058') {
    console.log('Kết nối thành công! Camera Dahua có thể truy cập qua cổng 37777.');
  }
  
  client.destroy();
});

client.on('close', () => {
  console.log('Kết nối đã đóng');
});

client.on('error', (err) => {
  console.error('Lỗi kết nối:', err.message);
});
    `;
    
    fs.writeFileSync(testScript, scriptContent);
    
    console.log(`Kiểm tra kết nối đến ${host}:37777...`);
    const { stdout, stderr } = await execAsync(`node ${testScript}`);
    
    console.log('Kết quả kiểm tra:');
    console.log(stdout);
    
    if (stderr) {
      console.error('Lỗi:', stderr);
    }
    
    return {
      success: !stderr && stdout.includes('Kết nối thành công'),
      output: stdout,
      error: stderr
    };
  } catch (error) {
    console.error('Lỗi khi kiểm tra kết nối qua cổng 37777:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  startVlcStream,
  stopVlcStream,
  checkVlcStreamStatus,
  connectDahuaPort37777
};