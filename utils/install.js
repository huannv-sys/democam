/**
 * Script cài đặt và kiểm tra môi trường
 * Chạy script này để chuẩn bị môi trường cho ứng dụng
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

// Tạo giao diện đọc/ghi
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Cấu hình màu sắc cho đầu ra
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Hàm in thông báo với màu sắc
function printMessage(message, color = colors.reset) {
  console.log(color + message + colors.reset);
}

// Kiểm tra các dependencies của hệ thống
async function checkSystemDependencies() {
  printMessage('\n--- Kiểm tra các gói phụ thuộc hệ thống ---', colors.bright + colors.cyan);
  
  // Kiểm tra Node.js
  try {
    const nodeVersion = execSync('node -v').toString().trim();
    printMessage(`✓ Node.js: ${nodeVersion}`, colors.green);
    
    // Kiểm tra phiên bản Node.js
    const versionNum = nodeVersion.replace('v', '').split('.');
    if (parseInt(versionNum[0]) < 18) {
      printMessage(`⚠ Cảnh báo: Khuyến nghị phiên bản Node.js >= 18.x`, colors.yellow);
    }
  } catch (error) {
    printMessage(`✗ Node.js chưa được cài đặt`, colors.red);
    printMessage(`  Vui lòng cài đặt Node.js từ https://nodejs.org`, colors.yellow);
    return false;
  }
  
  // Kiểm tra npm
  try {
    const npmVersion = execSync('npm -v').toString().trim();
    printMessage(`✓ npm: ${npmVersion}`, colors.green);
  } catch (error) {
    printMessage(`✗ npm chưa được cài đặt đúng cách`, colors.red);
    return false;
  }
  
  // Kiểm tra FFmpeg
  let ffmpegInstalled = false;
  try {
    const ffmpegVersion = execSync('ffmpeg -version').toString().split('\n')[0];
    printMessage(`✓ FFmpeg: ${ffmpegVersion}`, colors.green);
    ffmpegInstalled = true;
  } catch (error) {
    printMessage(`✗ FFmpeg chưa được cài đặt`, colors.red);
    printMessage(`  FFmpeg là bắt buộc để stream RTSP`, colors.yellow);
  }
  
  // Kiểm tra VLC (tùy chọn)
  try {
    const vlcVersion = execSync('vlc --version').toString().split('\n')[0];
    printMessage(`✓ VLC: ${vlcVersion}`, colors.green);
  } catch (error) {
    printMessage(`ℹ VLC chưa được cài đặt (tùy chọn)`, colors.yellow);
    printMessage(`  VLC được sử dụng cho chế độ stream dự phòng`, colors.yellow);
  }
  
  // Nếu FFmpeg chưa được cài đặt, hỏi người dùng có muốn cài đặt không
  if (!ffmpegInstalled) {
    return new Promise((resolve) => {
      rl.question('Bạn có muốn cài đặt FFmpeg không? (y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          try {
            printMessage('Đang cài đặt FFmpeg...', colors.cyan);
            // Phát hiện hệ điều hành
            const platform = process.platform;
            if (platform === 'linux') {
              execSync('sudo apt-get update && sudo apt-get install -y ffmpeg', { stdio: 'inherit' });
            } else if (platform === 'darwin') {
              execSync('brew install ffmpeg', { stdio: 'inherit' });
            } else if (platform === 'win32') {
              printMessage('Vui lòng cài đặt FFmpeg từ https://ffmpeg.org/download.html', colors.yellow);
              printMessage('Sau đó thêm đường dẫn FFmpeg vào biến môi trường PATH', colors.yellow);
            }
            printMessage('✓ FFmpeg đã được cài đặt', colors.green);
            resolve(true);
          } catch (error) {
            printMessage(`✗ Không thể cài đặt FFmpeg: ${error.message}`, colors.red);
            resolve(false);
          }
        } else {
          printMessage('⚠ FFmpeg là cần thiết để stream camera. Ứng dụng có thể không hoạt động đúng.', colors.yellow);
          resolve(false);
        }
      });
    });
  }
  
  return true;
}

// Kiểm tra và cài đặt các gói npm
async function installNodeDependencies() {
  printMessage('\n--- Kiểm tra các gói npm ---', colors.bright + colors.cyan);
  
  try {
    printMessage('Đang cài đặt các gói phụ thuộc...', colors.cyan);
    execSync('npm install', { stdio: 'inherit' });
    printMessage('✓ Các gói phụ thuộc đã được cài đặt', colors.green);
    return true;
  } catch (error) {
    printMessage(`✗ Không thể cài đặt các gói phụ thuộc: ${error.message}`, colors.red);
    return false;
  }
}

// Tạo các thư mục cần thiết
function createRequiredDirectories() {
  printMessage('\n--- Tạo cấu trúc thư mục ---', colors.bright + colors.cyan);
  
  const directories = [
    './public/snapshots',
    './public/analytics',
    './logs',
    './config'
  ];
  
  try {
    directories.forEach(dir => {
      fs.ensureDirSync(dir);
      printMessage(`✓ Đã tạo thư mục: ${dir}`, colors.green);
    });
    return true;
  } catch (error) {
    printMessage(`✗ Không thể tạo thư mục: ${error.message}`, colors.red);
    return false;
  }
}

// Thiết lập tệp cấu hình
async function setupConfiguration() {
  printMessage('\n--- Thiết lập cấu hình ---', colors.bright + colors.cyan);
  
  // Kiểm tra xem tệp .env đã tồn tại chưa
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    try {
      fs.copyFileSync(envExamplePath, envPath);
      printMessage(`✓ Đã tạo tệp .env từ mẫu`, colors.green);
    } catch (error) {
      printMessage(`✗ Không thể tạo tệp .env: ${error.message}`, colors.red);
    }
  } else if (fs.existsSync(envPath)) {
    printMessage(`ℹ Tệp .env đã tồn tại`, colors.yellow);
  }
  
  // Kiểm tra các tệp cấu hình khác
  const configPath = path.join(process.cwd(), 'config', 'default.json');
  if (!fs.existsSync(configPath)) {
    try {
      const defaultConfig = {
        server: {
          port: 5000,
          host: "0.0.0.0"
        },
        camera: {
          connectTimeout: 8000,
          retryAttempts: 3,
          snapshotRefreshRate: 30000
        },
        analytics: {
          enabled: true,
          scheduleInterval: "*/5 * * * *",
          defaultOptions: {
            detectPersons: true,
            detectFaces: false,
            detectLicensePlates: false,
            detectObjects: true
          }
        },
        storage: {
          snapshotDir: "./public/snapshots",
          analyticsDir: "./public/analytics",
          logDir: "./logs",
          retentionDays: 30
        },
        stream: {
          portRange: {
            start: 9000,
            end: 9999
          },
          ffmpegPath: "",
          enableVLC: true
        }
      };
      
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      printMessage(`✓ Đã tạo tệp cấu hình mặc định`, colors.green);
    } catch (error) {
      printMessage(`✗ Không thể tạo tệp cấu hình: ${error.message}`, colors.red);
    }
  } else {
    printMessage(`ℹ Tệp cấu hình đã tồn tại`, colors.yellow);
  }
  
  return new Promise((resolve) => {
    rl.question('Bạn có muốn cấu hình SESSION_SECRET không? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        rl.question('Nhập khóa bí mật cho phiên (hoặc nhấn Enter để tạo ngẫu nhiên): ', (secret) => {
          try {
            let sessionSecret = secret;
            if (!sessionSecret) {
              // Tạo khóa ngẫu nhiên
              sessionSecret = require('crypto').randomBytes(32).toString('hex');
            }
            
            // Đọc tệp .env hiện tại
            let envContent = fs.readFileSync(envPath, 'utf8');
            
            // Thay thế hoặc thêm SESSION_SECRET
            if (envContent.includes('SESSION_SECRET=')) {
              envContent = envContent.replace(/SESSION_SECRET=.*/, `SESSION_SECRET=${sessionSecret}`);
            } else {
              envContent += `\nSESSION_SECRET=${sessionSecret}`;
            }
            
            // Ghi lại tệp .env
            fs.writeFileSync(envPath, envContent);
            printMessage(`✓ Đã cập nhật SESSION_SECRET`, colors.green);
            resolve(true);
          } catch (error) {
            printMessage(`✗ Không thể cập nhật SESSION_SECRET: ${error.message}`, colors.red);
            resolve(false);
          }
        });
      } else {
        resolve(true);
      }
    });
  });
}

// Kiểm tra và cài đặt DeepStack AI (tùy chọn)
async function checkDeepStackAI() {
  printMessage('\n--- Kiểm tra DeepStack AI (tùy chọn) ---', colors.bright + colors.cyan);
  
  return new Promise((resolve) => {
    rl.question('Bạn có muốn sử dụng DeepStack AI không? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        printMessage('ℹ Bạn có thể cấu hình DeepStack trong tệp .env', colors.yellow);
        printMessage('  Xem thêm tại: https://github.com/johnolafenwa/deepstack', colors.yellow);
        
        rl.question('Bạn có muốn cấu hình DeepStack ngay bây giờ không? (y/n): ', (answer2) => {
          if (answer2.toLowerCase() === 'y') {
            rl.question('Nhập máy chủ DeepStack (ví dụ: localhost): ', (host) => {
              rl.question('Nhập cổng DeepStack (ví dụ: 80): ', (port) => {
                rl.question('Nhập khóa API DeepStack (nếu có): ', (apiKey) => {
                  try {
                    // Đọc tệp .env hiện tại
                    const envPath = path.join(process.cwd(), '.env');
                    let envContent = fs.readFileSync(envPath, 'utf8');
                    
                    // Cập nhật cấu hình DeepStack
                    const deepstackConfig = [
                      `DEEPSTACK_HOST=${host || ''}`,
                      `DEEPSTACK_PORT=${port || '80'}`,
                      `DEEPSTACK_API_KEY=${apiKey || ''}`
                    ];
                    
                    deepstackConfig.forEach(config => {
                      const [key, value] = config.split('=');
                      if (envContent.includes(key + '=')) {
                        envContent = envContent.replace(
                          new RegExp(key + '=.*', 'g'), 
                          config
                        );
                      } else {
                        envContent += `\n${config}`;
                      }
                    });
                    
                    // Ghi lại tệp .env
                    fs.writeFileSync(envPath, envContent);
                    printMessage(`✓ Đã cập nhật cấu hình DeepStack`, colors.green);
                    resolve(true);
                  } catch (error) {
                    printMessage(`✗ Không thể cập nhật cấu hình DeepStack: ${error.message}`, colors.red);
                    resolve(false);
                  }
                });
              });
            });
          } else {
            resolve(true);
          }
        });
      } else {
        resolve(true);
      }
    });
  });
}

// Hàm chính
async function main() {
  printMessage('=== Camera Monitoring Platform - Cài đặt ===', colors.bright + colors.cyan);
  
  try {
    await checkSystemDependencies();
    createRequiredDirectories();
    await installNodeDependencies();
    await setupConfiguration();
    await checkDeepStackAI();
    
    printMessage('\n=== Quá trình cài đặt đã hoàn tất ===', colors.bright + colors.green);
    printMessage('Để khởi động ứng dụng, chạy lệnh:', colors.cyan);
    printMessage('  node server.js', colors.bright);
    printMessage('Sau đó truy cập vào địa chỉ:', colors.cyan);
    printMessage('  http://localhost:5000', colors.bright);
  } catch (error) {
    printMessage(`\n✗ Đã xảy ra lỗi trong quá trình cài đặt: ${error.message}`, colors.red);
  } finally {
    rl.close();
  }
}

// Chạy script
main();