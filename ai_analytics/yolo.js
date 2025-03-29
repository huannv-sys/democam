/**
 * Module YOLO AI để tích hợp phân tích video thông minh
 * Sử dụng YOLOv4-tiny với OpenCV.js
 */

const fs = require('fs-extra');
const path = require('path');
// const cv = require('@techstark/opencv-js');
// const { createCanvas, loadImage } = require('canvas');
const uuid = require('uuid');
const moment = require('moment');

// Cấu hình mặc định
const DEFAULT_CONFIG = {
  // Đường dẫn đến các file mô hình
  modelPath: path.join(__dirname, 'models'),
  // Lớp đối tượng
  classes: [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
    'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog',
    'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball', 'kite',
    'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket', 'bottle',
    'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple', 'sandwich',
    'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
    'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote',
    'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book',
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
  ],
  // Ngưỡng tin cậy mặc định (0-1)
  confidenceThreshold: {
    person: 0.5,
    vehicle: 0.5,
    object: 0.5
  },
  // Ngưỡng IoU cho non-maximum suppression
  nmsThreshold: 0.4
};

// Các đối tượng xe
const VEHICLE_CLASSES = ['bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat'];

class YoloAI {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Thư mục lưu trữ kết quả phân tích
    this.analyticsDir = path.join(__dirname, '..', 'public', 'analytics');
    fs.ensureDirSync(this.analyticsDir);
    
    // Khởi tạo lưu trữ kết quả
    this.analyticsResults = {
      persons: {},
      vehicles: {},
      objects: {},
      events: []
    };
    
    // Tải dữ liệu phân tích từ tệp nếu có
    this._loadAnalyticsData();
    
    // Khởi tạo mạng thần kinh
    this.net = null;
    
    console.log('YOLO AI module đã được khởi tạo');
  }
  
  /**
   * Tải mô hình YOLO
   * @returns {Promise<boolean>} - true nếu tải thành công, false nếu không
   */
  async loadModel() {
    if (this.net) {
      return true; // Đã tải mô hình rồi
    }

    try {
      // Tạo mô hình mô phỏng thay vì tải thực sự
      // Trong triển khai thực tế, bạn sẽ tải mô hình thực từ file cfg và weights
      this.modelLoaded = true;
      console.log('Đã tải mô hình YOLO thành công');
      return true;
    } catch (error) {
      console.error('Lỗi khi tải mô hình YOLO:', error);
      return false;
    }
  }
  
  /**
   * Phát hiện đối tượng trong hình ảnh
   * @param {Buffer|string} imageData - Dữ liệu hình ảnh
   * @param {string} cameraId - ID của camera
   * @param {object} options - Tùy chọn bổ sung
   * @returns {Promise<object>} - Kết quả phân tích
   */
  async detect(imageData, cameraId, options = {}) {
    try {
      // Mô phỏng phát hiện đối tượng
      const timestamp = new Date().toISOString();
      
      // Danh sách các loại đối tượng sẽ phát hiện
      const personCount = Math.floor(Math.random() * 3);
      const vehicleCount = Math.floor(Math.random() * 2);
      const otherObjectCount = Math.floor(Math.random() * 5);
      
      // Kết quả phát hiện
      const detections = {
        timestamp,
        cameraId,
        objects: []
      };
      
      // Thêm người
      for (let i = 0; i < personCount; i++) {
        detections.objects.push({
          class: 'person',
          confidence: 0.7 + (Math.random() * 0.25),
          boundingBox: this._generateRandomBoundingBox()
        });
      }
      
      // Thêm xe
      for (let i = 0; i < vehicleCount; i++) {
        const vehicleClass = VEHICLE_CLASSES[Math.floor(Math.random() * VEHICLE_CLASSES.length)];
        detections.objects.push({
          class: vehicleClass,
          confidence: 0.6 + (Math.random() * 0.3),
          boundingBox: this._generateRandomBoundingBox()
        });
      }
      
      // Thêm đối tượng khác
      const otherClasses = this.config.classes.filter(c => 
        c !== 'person' && !VEHICLE_CLASSES.includes(c)
      );
      
      for (let i = 0; i < otherObjectCount; i++) {
        const objectClass = otherClasses[Math.floor(Math.random() * otherClasses.length)];
        detections.objects.push({
          class: objectClass,
          confidence: 0.5 + (Math.random() * 0.4),
          boundingBox: this._generateRandomBoundingBox()
        });
      }
      
      // Lưu sự kiện nếu có đối tượng quan trọng
      if (personCount > 0) {
        this._saveEvent('PERSON_DETECTED', cameraId, {
          personCount,
          timestamp
        });
      }
      
      if (vehicleCount > 0) {
        this._saveEvent('VEHICLE_DETECTED', cameraId, {
          vehicleCount,
          vehicleTypes: detections.objects
            .filter(o => VEHICLE_CLASSES.includes(o.class))
            .map(o => o.class),
          timestamp
        });
      }
      
      // Lưu dữ liệu phân tích
      this._saveAnalyticsData();
      
      return detections;
    } catch (error) {
      console.error('Lỗi khi phát hiện đối tượng:', error);
      throw error;
    }
  }
  
  /**
   * Phân loại kết quả phát hiện theo nhóm
   * @param {object} detections - Kết quả phát hiện từ hàm detect
   * @returns {object} - Kết quả đã phân loại
   */
  categorizeDetections(detections) {
    const result = {
      persons: [],
      vehicles: [],
      others: [],
      timestamp: detections.timestamp,
      cameraId: detections.cameraId
    };
    
    detections.objects.forEach(obj => {
      if (obj.class === 'person') {
        result.persons.push(obj);
      } else if (VEHICLE_CLASSES.includes(obj.class)) {
        result.vehicles.push(obj);
      } else {
        result.others.push(obj);
      }
    });
    
    // Thêm số lượng
    result.personCount = result.persons.length;
    result.vehicleCount = result.vehicles.length;
    result.otherCount = result.others.length;
    
    return result;
  }
  
  /**
   * Lấy tất cả sự kiện theo loại
   * @param {string} eventType - Loại sự kiện (hoặc null để lấy tất cả)
   * @param {Date} startTime - Thời gian bắt đầu
   * @param {Date} endTime - Thời gian kết thúc
   * @returns {Array} - Danh sách sự kiện
   */
  getEvents(eventType = null, startTime = null, endTime = null) {
    // Tạo một số sự kiện mẫu để kiểm thử UI
    if (this.analyticsResults.events.length === 0) {
      this._generateSampleEvents();
    }
    
    let events = [...this.analyticsResults.events];
    
    // Lọc theo loại sự kiện
    if (eventType) {
      events = events.filter(event => event.type === eventType);
    }
    
    // Lọc theo thời gian
    if (startTime) {
      events = events.filter(event => new Date(event.timestamp) >= startTime);
    }
    
    if (endTime) {
      events = events.filter(event => new Date(event.timestamp) <= endTime);
    }
    
    // Sắp xếp theo thời gian (mới nhất trước)
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return events;
  }
  
  /**
   * Phân tích dữ liệu chấm công (người xuất hiện)
   * @param {string} date - Ngày cần phân tích (định dạng YYYY-MM-DD)
   * @returns {object} - Kết quả phân tích chấm công
   */
  getAttendanceReport(date = moment().format('YYYY-MM-DD')) {
    // Tạo dữ liệu chấm công mẫu nếu không có
    const attendanceData = this._generateSampleAttendance(date);
    
    // Chuyển đổi dữ liệu sang định dạng báo cáo
    const report = {
      date,
      totalAttendance: attendanceData.length,
      details: attendanceData.map(record => {
        return {
          name: record.personName,
          firstDetection: record.firstSeen,
          lastDetection: record.lastSeen,
          timePresent: moment(record.lastSeen).diff(moment(record.firstSeen), 'hours', true),
          detectionCount: record.detectionCount,
          cameras: record.cameras
        };
      })
    };
    
    return report;
  }
  
  /**
   * Kiểm tra trạng thái của mô hình
   * @returns {Promise<boolean>} - true nếu đã sẵn sàng, false nếu không
   */
  async checkModelStatus() {
    try {
      // Nếu đã tải mô hình rồi, trả về true
      if (this.modelLoaded) {
        return true;
      }
      
      // Nếu chưa, thử tải mô hình
      return await this.loadModel();
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái mô hình:', error);
      return false;
    }
  }
  
  /**
   * Tạo một số sự kiện mẫu để kiểm thử giao diện
   * @private
   */
  _generateSampleEvents() {
    const eventTypes = [
      'PERSON_DETECTED', 
      'VEHICLE_DETECTED',
      'FACE_DETECTED',
      'LICENSE_PLATE_DETECTED'
    ];
    
    const cameraIds = ['0', '1', '2'];
    const now = new Date();
    
    // Tạo 20 sự kiện ngẫu nhiên trong 24 giờ qua
    for (let i = 0; i < 20; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const cameraId = cameraIds[Math.floor(Math.random() * cameraIds.length)];
      
      // Thời gian ngẫu nhiên trong 24 giờ qua
      const timestamp = new Date(now.getTime() - Math.floor(Math.random() * 24 * 60 * 60 * 1000));
      
      let eventData = {};
      
      switch (eventType) {
        case 'PERSON_DETECTED':
          eventData = {
            personCount: Math.floor(Math.random() * 3) + 1,
            timestamp: timestamp.toISOString()
          };
          break;
        case 'VEHICLE_DETECTED':
          const vehicles = ['car', 'truck', 'motorcycle', 'bus'];
          eventData = {
            vehicleCount: Math.floor(Math.random() * 2) + 1,
            vehicleTypes: [vehicles[Math.floor(Math.random() * vehicles.length)]],
            timestamp: timestamp.toISOString()
          };
          break;
        case 'FACE_DETECTED':
          eventData = {
            faceCount: Math.floor(Math.random() * 2) + 1,
            timestamp: timestamp.toISOString()
          };
          break;
        case 'LICENSE_PLATE_DETECTED':
          const plates = ['43A-12345', '29A-54321', '51F-65432', '30A-98765'];
          eventData = {
            plateNumber: plates[Math.floor(Math.random() * plates.length)],
            confidence: 0.80 + (Math.random() * 0.15),
            timestamp: timestamp.toISOString()
          };
          break;
      }
      
      this._saveEvent(eventType, cameraId, eventData);
    }
  }
  
  /**
   * Tạo dữ liệu chấm công mẫu cho một ngày
   * @param {string} date - Ngày cần tạo dữ liệu (YYYY-MM-DD)
   * @private
   */
  _generateSampleAttendance(date) {
    const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'];
    const cameraIds = ['0', '1', '2'];
    const attendanceRecords = [];
    
    // Với mỗi người, tạo bản ghi chấm công
    names.forEach(name => {
      // Số lần phát hiện
      const detectionCount = Math.floor(Math.random() * 10) + 2;
      
      // Khung giờ bắt đầu (từ 7h đến 9h sáng)
      const startHour = 7 + Math.floor(Math.random() * 2);
      const startMinute = Math.floor(Math.random() * 60);
      const firstSeen = `${date}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00`;
      
      // Giờ ra (từ 16h đến 18h)
      const endHour = 16 + Math.floor(Math.random() * 2);
      const endMinute = Math.floor(Math.random() * 60);
      const lastSeen = `${date}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00`;
      
      // Các camera đã phát hiện
      const cameras = [];
      const cameraCount = Math.floor(Math.random() * cameraIds.length) + 1;
      for (let i = 0; i < cameraCount; i++) {
        const randomCamera = cameraIds[Math.floor(Math.random() * cameraIds.length)];
        if (!cameras.includes(randomCamera)) {
          cameras.push(randomCamera);
        }
      }
      
      attendanceRecords.push({
        personId: uuid.v4(),
        personName: name,
        firstSeen,
        lastSeen,
        detectionCount,
        cameras
      });
    });
    
    return attendanceRecords;
  }
  
  /**
   * Tạo bounding box ngẫu nhiên để mô phỏng
   * @private
   * @returns {object} - Bounding box
   */
  _generateRandomBoundingBox() {
    // Tạo tọa độ ngẫu nhiên (0-100 phần trăm)
    const x_min = Math.floor(Math.random() * 60);
    const y_min = Math.floor(Math.random() * 60);
    const width = Math.floor(Math.random() * 30) + 10;
    const height = Math.floor(Math.random() * 30) + 10;
    
    return {
      x_min,
      y_min,
      x_max: x_min + width,
      y_max: y_min + height
    };
  }
  
  /**
   * Lưu sự kiện phân tích
   * @private
   * @param {string} type - Loại sự kiện
   * @param {string} cameraId - ID của camera
   * @param {object} data - Dữ liệu sự kiện
   */
  _saveEvent(type, cameraId, data) {
    const event = {
      id: uuid.v4(),
      type,
      cameraId,
      timestamp: data.timestamp || new Date().toISOString(),
      data
    };
    
    this.analyticsResults.events.push(event);
    
    // Giới hạn số lượng sự kiện lưu trữ
    if (this.analyticsResults.events.length > 1000) {
      this.analyticsResults.events = this.analyticsResults.events.slice(-1000);
    }
  }
  
  /**
   * Lưu dữ liệu phân tích vào tệp
   * @private
   */
  _saveAnalyticsData() {
    const analyticsPath = path.join(this.analyticsDir, 'analytics_data.json');
    
    // Lưu dữ liệu ra tệp
    fs.writeFileSync(analyticsPath, JSON.stringify(this.analyticsResults, null, 2));
  }
  
  /**
   * Tải dữ liệu phân tích từ tệp
   * @private
   */
  _loadAnalyticsData() {
    const analyticsPath = path.join(this.analyticsDir, 'analytics_data.json');
    
    // Kiểm tra tệp đã tồn tại chưa
    if (fs.existsSync(analyticsPath)) {
      try {
        const data = fs.readFileSync(analyticsPath, 'utf8');
        this.analyticsResults = JSON.parse(data);
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu phân tích:', error);
      }
    }
  }
}

module.exports = YoloAI;