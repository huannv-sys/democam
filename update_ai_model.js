/**
 * Script để tự động cập nhật/tải xuống mô hình AI
 * Tải xuống mô hình YOLO và chuẩn bị cho việc phân tích AI
 */

const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Đường dẫn để lưu mô hình
const MODEL_DIR = path.join(__dirname, 'ai_analytics', 'models');
const DATA_DIR = path.join(__dirname, 'ai_analytics', 'data');

// URL mô hình
const MODEL_URLS = {
  yolov4_tiny: {
    weights: 'https://github.com/AlexeyAB/darknet/releases/download/yolov4/yolov4-tiny.weights',
    cfg: 'https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4-tiny.cfg'
  },
  yolov4: {
    weights: 'https://github.com/AlexeyAB/darknet/releases/download/yolov4/yolov4.weights',
    cfg: 'https://raw.githubusercontent.com/AlexeyAB/darknet/master/cfg/yolov4.cfg'
  },
  coco_names: 'https://raw.githubusercontent.com/AlexeyAB/darknet/master/data/coco.names'
};

// Tạo thư mục nếu chưa tồn tại
fs.ensureDirSync(MODEL_DIR);
fs.ensureDirSync(DATA_DIR);

// Hàm tải tệp từ URL và lưu vào đường dẫn cục bộ
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    console.log(`Đang tải xuống từ ${url}...`);
    
    const file = fs.createWriteStream(filePath);
    let downloadedBytes = 0;
    let totalBytes = 0;
    let lastProgressTime = Date.now();
    
    https.get(url, response => {
      if (response.statusCode !== 200) {
        reject(new Error(`Yêu cầu không thành công: ${response.statusCode}`));
        return;
      }
      
      totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      
      response.on('data', chunk => {
        downloadedBytes += chunk.length;
        
        // Hiển thị tiến trình tải xuống mỗi 1 giây
        const now = Date.now();
        if (now - lastProgressTime > 1000) {
          const progress = totalBytes ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
          console.log(`Đã tải: ${progress}% (${formatBytes(downloadedBytes)}/${formatBytes(totalBytes)})`);
          lastProgressTime = now;
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Đã lưu vào: ${filePath}`);
        resolve();
      });
    }).on('error', err => {
      fs.unlink(filePath, () => {}); // Xóa tệp nếu có lỗi
      reject(err);
    });
    
    file.on('error', err => {
      fs.unlink(filePath, () => {}); // Xóa tệp nếu có lỗi
      reject(err);
    });
  });
}

// Hàm định dạng bytes thành đơn vị đọc được
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Hàm chính để cập nhật mô hình
async function updateModels() {
  console.log('=== Bắt đầu cập nhật mô hình AI ===');
  
  try {
    // Tải mô hình YOLOv4-tiny
    const yoloTinyWeightsPath = path.join(MODEL_DIR, 'yolov4-tiny.weights');
    const yoloTinyCfgPath = path.join(MODEL_DIR, 'yolov4-tiny.cfg');
    
    if (!fs.existsSync(yoloTinyWeightsPath)) {
      await downloadFile(MODEL_URLS.yolov4_tiny.weights, yoloTinyWeightsPath);
    } else {
      console.log('Mô hình YOLOv4-tiny.weights đã tồn tại.');
    }
    
    if (!fs.existsSync(yoloTinyCfgPath)) {
      await downloadFile(MODEL_URLS.yolov4_tiny.cfg, yoloTinyCfgPath);
    } else {
      console.log('Mô hình YOLOv4-tiny.cfg đã tồn tại.');
    }
    
    // Tải danh sách tên lớp COCO
    const cocoNamesPath = path.join(DATA_DIR, 'coco.names');
    
    if (!fs.existsSync(cocoNamesPath)) {
      await downloadFile(MODEL_URLS.coco_names, cocoNamesPath);
    } else {
      console.log('Tệp coco.names đã tồn tại.');
    }
    
    // Tạo tệp cấu hình
    const aiConfigPath = path.join(DATA_DIR, 'ai_config.json');
    
    if (!fs.existsSync(aiConfigPath)) {
      const aiConfig = {
        modelType: 'yolov4-tiny',
        modelPaths: {
          weights: yoloTinyWeightsPath,
          cfg: yoloTinyCfgPath,
          names: cocoNamesPath
        },
        confidence: {
          person: 0.5,
          vehicle: 0.5,
          object: 0.4
        },
        nmsThreshold: 0.4
      };
      
      fs.writeFileSync(aiConfigPath, JSON.stringify(aiConfig, null, 2));
      console.log('Đã tạo tệp cấu hình AI.');
    } else {
      console.log('Tệp cấu hình AI đã tồn tại.');
    }
    
    console.log('=== Cập nhật mô hình AI thành công ===');
  } catch (error) {
    console.error('Lỗi khi cập nhật mô hình:', error);
  }
}

// Chạy hàm cập nhật
updateModels();