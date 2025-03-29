/**
 * Module quản lý phân tích AI
 * Quản lý tất cả các tác vụ phân tích video AI như nhận diện khuôn mặt, ANPR, phân tích hành vi
 */
const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const YoloAI = require('./yolo');

class AIManager {
  constructor() {
    // Khởi tạo YOLO AI
    this.yolo = new YoloAI();
    
    // Thư mục lưu trữ snapshot và dữ liệu phân tích
    this.snapshotDir = path.join(__dirname, '..', 'public', 'snapshots');
    this.analyticsDir = path.join(__dirname, '..', 'public', 'analytics');
    
    // Đảm bảo thư mục tồn tại
    fs.ensureDirSync(this.snapshotDir);
    fs.ensureDirSync(this.analyticsDir);
    
    // Lịch phân tích
    this.schedules = {};
    
    console.log('AI Manager đã được khởi tạo');
  }
  
  /**
   * Phân tích ảnh từ camera
   * @param {string} cameraId - ID của camera
   * @param {Buffer} imageData - Dữ liệu hình ảnh
   * @param {object} options - Tùy chọn phân tích
   * @returns {Promise<object>} - Kết quả phân tích
   */
  async analyzeImage(cameraId, imageData, options = {}) {
    try {
      // Lưu ảnh vào thư mục cụ thể
      const timestamp = new Date().getTime();
      const imagePath = path.join(this.snapshotDir, `cam_${cameraId}_${timestamp}.jpg`);
      fs.writeFileSync(imagePath, imageData);
      
      // Kết quả phân tích
      const results = {
        cameraId,
        timestamp,
        imagePath: `/snapshots/cam_${cameraId}_${timestamp}.jpg`
      };
      
      // Phân tích dựa trên tùy chọn
      if (options.detectPersons) {
        try {
          // Sử dụng YOLO để phát hiện người
          const yoloResults = await this.yolo.detect(imageData, cameraId);
          
          // Phân loại kết quả
          const categorized = this.yolo.categorizeDetections(yoloResults);
          
          // Gán kết quả phát hiện người
          results.persons = {
            timestamp: new Date().toISOString(),
            cameraId,
            personCount: categorized.personCount,
            persons: categorized.persons.map(p => ({
              confidence: p.confidence,
              boundingBox: p.boundingBox
            }))
          };
        } catch (err) {
          console.error('Lỗi khi phát hiện người:', err);
          results.errors = results.errors || {};
          results.errors.persons = err.message;
        }
      }
      
      if (options.detectFaces) {
        try {
          // Mô phỏng nhận diện khuôn mặt
          results.faces = {
            timestamp: new Date().toISOString(),
            cameraId,
            faceCount: options.detectPersons ? Math.min(1, results.persons.personCount) : 1,
            faces: []
          };
          
          // Thêm kết quả mô phỏng
          for (let i = 0; i < results.faces.faceCount; i++) {
            results.faces.faces.push({
              confidence: 0.75 + (Math.random() * 0.2),
              boundingBox: {
                x_min: 35 + Math.floor(Math.random() * 10),
                y_min: 25 + Math.floor(Math.random() * 15),
                x_max: 55 + Math.floor(Math.random() * 10),
                y_max: 60 + Math.floor(Math.random() * 15)
              },
              gender: Math.random() > 0.5 ? 'Nam' : 'Nữ',
              age: 25 + Math.floor(Math.random() * 30)
            });
          }
          
          // Thực tế sẽ sử dụng code này khi tích hợp DeepStack:
          // results.faces = await this.deepstack.detectFaces(imageData, cameraId, {
          //   saveFaces: options.saveFaces || false
          // });
        } catch (err) {
          console.error('Lỗi khi nhận diện khuôn mặt:', err);
          results.errors = results.errors || {};
          results.errors.faces = err.message;
        }
      }
      
      if (options.detectLicensePlates) {
        try {
          // Mô phỏng nhận diện biển số xe
          const plateTexts = ['43A-12345', '29A-54321', '51F-65432', '30A-98765'];
          
          results.licensePlates = {
            timestamp: new Date().toISOString(),
            cameraId,
            plateCount: Math.random() > 0.5 ? 1 : 0,
            licensePlates: []
          };
          
          // Thêm kết quả mô phỏng
          for (let i = 0; i < results.licensePlates.plateCount; i++) {
            results.licensePlates.licensePlates.push({
              text: plateTexts[Math.floor(Math.random() * plateTexts.length)],
              confidence: 0.80 + (Math.random() * 0.15),
              boundingBox: {
                x_min: 40 + Math.floor(Math.random() * 20),
                y_min: 60 + Math.floor(Math.random() * 20),
                x_max: 80 + Math.floor(Math.random() * 10),
                y_max: 80 + Math.floor(Math.random() * 10)
              }
            });
          }
          
          // Thực tế sẽ sử dụng code này khi tích hợp DeepStack:
          // results.licensePlates = await this.deepstack.detectLicensePlates(imageData, cameraId);
        } catch (err) {
          console.error('Lỗi khi nhận diện biển số xe:', err);
          results.errors = results.errors || {};
          results.errors.licensePlates = err.message;
        }
      }
      
      if (options.detectObjects) {
        try {
          // Sử dụng YOLO để phát hiện đối tượng
          const yoloResults = await this.yolo.detect(imageData, cameraId);
          
          // Phân loại kết quả
          const categorized = this.yolo.categorizeDetections(yoloResults);
          
          // Kết hợp tất cả đối tượng (xe cộ và đối tượng khác)
          const allObjects = [...categorized.vehicles, ...categorized.others];
          
          results.objects = {
            timestamp: new Date().toISOString(),
            cameraId,
            objectCount: allObjects.length,
            objects: allObjects.map(obj => ({
              label: obj.class,
              confidence: obj.confidence,
              boundingBox: obj.boundingBox
            }))
          };
        } catch (err) {
          console.error('Lỗi khi phát hiện đối tượng:', err);
          results.errors = results.errors || {};
          results.errors.objects = err.message;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Lỗi khi phân tích hình ảnh:', error);
      throw error;
    }
  }
  
  /**
   * Thiết lập lịch phân tích tự động cho camera
   * @param {string} cameraId - ID của camera
   * @param {function} snapshotFunction - Hàm lấy snapshot từ camera
   * @param {string} schedule - Biểu thức cron (ví dụ cron cho 5 phút một lần)
   * @param {object} options - Tùy chọn phân tích
   */
  scheduleAnalysis(cameraId, snapshotFunction, schedule, options = {}) {
    // Kiểm tra giá trị đầu vào
    if (!cameraId || typeof snapshotFunction !== 'function') {
      throw new Error('cameraId và snapshotFunction là bắt buộc');
    }
    
    // Kiểm tra biểu thức cron hợp lệ
    if (!cron.validate(schedule)) {
      throw new Error('Biểu thức cron không hợp lệ');
    }
    
    // Hủy lịch trước đó nếu có
    if (this.schedules[cameraId]) {
      this.schedules[cameraId].stop();
    }
    
    // Mặc định phân tích
    const analysisOptions = {
      detectPersons: options.detectPersons !== false,
      detectFaces: options.detectFaces === true,
      detectLicensePlates: options.detectLicensePlates === true,
      detectObjects: options.detectObjects === true,
      targetObjects: options.targetObjects || null,
      saveFaces: options.saveFaces === true
    };
    
    // Lập lịch nhiệm vụ
    const task = cron.schedule(schedule, async () => {
      try {
        console.log(`Đang thực hiện phân tích theo lịch cho camera ${cameraId}`);
        
        // Lấy snapshot từ camera
        const snapshot = await snapshotFunction(cameraId);
        
        if (!snapshot || !Buffer.isBuffer(snapshot)) {
          console.error(`Không thể lấy snapshot hợp lệ từ camera ${cameraId}`);
          return;
        }
        
        // Phân tích hình ảnh
        const results = await this.analyzeImage(cameraId, snapshot, analysisOptions);
        
        // Lưu kết quả phân tích
        const analyticsFilePath = path.join(
          this.analyticsDir, 
          `analysis_${cameraId}_${new Date().getTime()}.json`
        );
        fs.writeFileSync(analyticsFilePath, JSON.stringify(results, null, 2));
        
        console.log(`Hoàn thành phân tích cho camera ${cameraId}`);
      } catch (error) {
        console.error(`Lỗi khi thực hiện phân tích theo lịch cho camera ${cameraId}:`, error);
      }
    });
    
    // Lưu lịch
    this.schedules[cameraId] = task;
    
    console.log(`Đã thiết lập lịch phân tích cho camera ${cameraId}: ${schedule}`);
    return task;
  }
  
  /**
   * Dừng lịch phân tích cho camera
   * @param {string} cameraId - ID của camera
   */
  stopSchedule(cameraId) {
    if (this.schedules[cameraId]) {
      this.schedules[cameraId].stop();
      delete this.schedules[cameraId];
      console.log(`Đã dừng lịch phân tích cho camera ${cameraId}`);
      return true;
    }
    return false;
  }
  
  /**
   * Dừng tất cả lịch phân tích
   */
  stopAllSchedules() {
    Object.keys(this.schedules).forEach(cameraId => {
      this.schedules[cameraId].stop();
      delete this.schedules[cameraId];
    });
    console.log('Đã dừng tất cả lịch phân tích');
  }
  
  /**
   * Lấy danh sách các lịch phân tích đang hoạt động
   * @returns {object} - Danh sách lịch phân tích
   */
  getActiveSchedules() {
    const activeSchedules = {};
    Object.keys(this.schedules).forEach(cameraId => {
      activeSchedules[cameraId] = {
        active: true,
        lastRunTime: this.schedules[cameraId].lastDate
      };
    });
    return activeSchedules;
  }
  
  /**
   * Lấy báo cáo chấm công
   * @param {string} date - Ngày cần lấy báo cáo (YYYY-MM-DD)
   * @returns {object} - Báo cáo chấm công
   */
  getAttendanceReport(date) {
    return this.yolo.getAttendanceReport(date);
  }
  
  /**
   * Lấy danh sách sự kiện phân tích
   * @param {object} options - Tùy chọn lọc sự kiện
   * @returns {Array} - Danh sách sự kiện
   */
  getAnalyticsEvents(options = {}) {
    return this.yolo.getEvents(
      options.eventType || null,
      options.startTime || null,
      options.endTime || null
    );
  }
  
  /**
   * Kiểm tra mô hình YOLO có khả dụng không
   * @returns {Promise<boolean>} - true nếu mô hình đã sẵn sàng, false nếu không
   */
  async isDeepStackAvailable() {
    try {
      return await this.yolo.checkModelStatus();
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái mô hình YOLO:', error);
      return false;
    }
  }
  
  /**
   * Phân tích hình ảnh và trả về dữ liệu để hiển thị trên giao diện web
   * @param {string} cameraId - ID của camera
   * @param {Buffer} imageData - Dữ liệu hình ảnh
   * @param {object} options - Tùy chọn phân tích
   * @returns {Promise<object>} - Kết quả phân tích đã xử lý cho giao diện
   */
  async analyzeForDisplay(cameraId, imageData, options = {}) {
    try {
      // Thực hiện phân tích
      const results = await this.analyzeImage(cameraId, imageData, options);
      
      // Xử lý kết quả cho giao diện web
      const displayData = {
        imagePath: results.imagePath,
        timestamp: results.timestamp,
        detections: {
          persons: [],
          faces: [],
          licensePlates: [],
          objects: []
        },
        summary: {
          personCount: 0,
          faceCount: 0,
          licensePlateCount: 0,
          objectCount: 0
        }
      };
      
      // Thêm kết quả phát hiện người
      if (results.persons && results.persons.persons) {
        displayData.detections.persons = results.persons.persons.map(person => ({
          confidence: (person.confidence * 100).toFixed(1),
          boundingBox: person.boundingBox
        }));
        displayData.summary.personCount = results.persons.personCount;
      }
      
      // Thêm kết quả nhận diện khuôn mặt
      if (results.faces && results.faces.faces) {
        displayData.detections.faces = results.faces.faces.map(face => ({
          confidence: (face.confidence * 100).toFixed(1),
          boundingBox: face.boundingBox,
          gender: face.gender,
          age: face.age
        }));
        displayData.summary.faceCount = results.faces.faceCount;
      }
      
      // Thêm kết quả nhận diện biển số
      if (results.licensePlates && results.licensePlates.licensePlates) {
        displayData.detections.licensePlates = results.licensePlates.licensePlates.map(plate => ({
          text: plate.text,
          confidence: (plate.confidence * 100).toFixed(1),
          boundingBox: plate.boundingBox
        }));
        displayData.summary.licensePlateCount = results.licensePlates.plateCount;
      }
      
      // Thêm kết quả phát hiện đối tượng
      if (results.objects && results.objects.objects) {
        displayData.detections.objects = results.objects.objects.map(object => ({
          label: object.label,
          confidence: (object.confidence * 100).toFixed(1),
          boundingBox: object.boundingBox
        }));
        displayData.summary.objectCount = results.objects.objectCount;
      }
      
      return displayData;
    } catch (error) {
      console.error('Lỗi khi phân tích hình ảnh cho hiển thị:', error);
      throw error;
    }
  }
}

module.exports = new AIManager();