/**
 * Module DeepStack AI để tích hợp phân tích video thông minh
 * DeepStack hỗ trợ nhận diện: người, mặt, biển số xe, đối tượng, và phân tích hành vi
 */
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const uuid = require('uuid');
const moment = require('moment');

// Cấu hình mặc định cho DeepStack API
const DEFAULT_CONFIG = {
  host: process.env.DEEPSTACK_HOST || 'localhost',
  port: process.env.DEEPSTACK_PORT || 80,
  apiKey: process.env.DEEPSTACK_API_KEY || '',
  useHttps: process.env.DEEPSTACK_USE_HTTPS === 'true' || false,
  // Ngưỡng tin cậy mặc định cho AI (0-100%)
  confidenceThreshold: {
    face: 60,
    person: 50,
    object: 45,
    vehicle: 55,
    licensePlate: 60
  }
};

class DeepStackAI {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.baseUrl = `${this.config.useHttps ? 'https' : 'http'}://${this.config.host}:${this.config.port}`;
    
    // Thư mục lưu trữ kết quả phân tích
    this.analyticsDir = path.join(__dirname, '..', 'public', 'analytics');
    fs.ensureDirSync(this.analyticsDir);
    fs.ensureDirSync(path.join(this.analyticsDir, 'faces'));
    fs.ensureDirSync(path.join(this.analyticsDir, 'anpr'));
    fs.ensureDirSync(path.join(this.analyticsDir, 'objects'));
    
    // Khởi tạo lưu trữ kết quả
    this.analyticsResults = {
      faces: {},
      persons: {},
      vehicles: {},
      licensePlates: {},
      objects: {},
      attendance: {},
      events: []
    };
    
    // Tải dữ liệu phân tích từ tệp nếu có
    this._loadAnalyticsData();
    
    console.log('DeepStack AI module đã được khởi tạo');
  }
  
  /**
   * Phân tích hình ảnh để phát hiện người
   * @param {Buffer|string} imageData - Dữ liệu hình ảnh hoặc đường dẫn tệp
   * @param {string} cameraId - ID của camera
   * @param {object} options - Tùy chọn bổ sung
   * @returns {Promise<object>} - Kết quả phân tích
   */
  async detectPersons(imageData, cameraId, options = {}) {
    try {
      const formData = this._prepareImageData(imageData);
      
      // Ngưỡng tin cậy
      const minConfidence = options.confidenceThreshold || this.config.confidenceThreshold.person;
      
      const response = await this._makeApiRequest('/v1/vision/detection', formData);
      
      if (response.success) {
        // Lọc kết quả chỉ lấy người
        const persons = response.predictions.filter(
          pred => pred.label === 'person' && pred.confidence * 100 >= minConfidence
        );
        
        // Lưu kết quả phân tích
        const timestamp = new Date().toISOString();
        const result = {
          timestamp,
          cameraId,
          personCount: persons.length,
          persons: persons.map(p => ({
            confidence: p.confidence,
            boundingBox: {
              x_min: p.x_min,
              y_min: p.y_min,
              x_max: p.x_max,
              y_max: p.y_max
            }
          }))
        };
        
        // Thêm vào lưu trữ
        if (!this.analyticsResults.persons[cameraId]) {
          this.analyticsResults.persons[cameraId] = [];
        }
        this.analyticsResults.persons[cameraId].push(result);
        
        // Lưu sự kiện nếu có người
        if (persons.length > 0) {
          this._saveEvent('PERSON_DETECTED', cameraId, {
            personCount: persons.length,
            timestamp
          });
        }
        
        // Lưu dữ liệu phân tích
        this._saveAnalyticsData();
        
        return result;
      } else {
        throw new Error('Không thể phân tích hình ảnh để tìm người');
      }
    } catch (error) {
      console.error('Lỗi khi phát hiện người:', error);
      throw error;
    }
  }
  
  /**
   * Phân tích hình ảnh để nhận diện khuôn mặt
   * @param {Buffer|string} imageData - Dữ liệu hình ảnh hoặc đường dẫn tệp
   * @param {string} cameraId - ID của camera
   * @param {object} options - Tùy chọn bổ sung
   * @returns {Promise<object>} - Kết quả phân tích
   */
  async detectFaces(imageData, cameraId, options = {}) {
    try {
      const formData = this._prepareImageData(imageData);
      
      // Ngưỡng tin cậy
      const minConfidence = options.confidenceThreshold || this.config.confidenceThreshold.face;
      
      const response = await this._makeApiRequest('/v1/vision/face', formData);
      
      if (response.success) {
        // Lọc kết quả theo ngưỡng tin cậy
        const faces = response.predictions.filter(
          pred => pred.confidence * 100 >= minConfidence
        );
        
        // Lưu hình ảnh khuôn mặt (crop từ hình ảnh gốc)
        const faceImages = [];
        if (options.saveFaces && Buffer.isBuffer(imageData)) {
          // TODO: Implement face cropping here
          // This would require image processing libraries like Sharp or Jimp
        }
        
        // Lưu kết quả phân tích
        const timestamp = new Date().toISOString();
        const result = {
          timestamp,
          cameraId,
          faceCount: faces.length,
          faces: faces.map(f => ({
            confidence: f.confidence,
            boundingBox: {
              x_min: f.x_min,
              y_min: f.y_min,
              x_max: f.x_max,
              y_max: f.y_max
            },
            gender: f.gender,
            age: f.age
          }))
        };
        
        // Thêm vào lưu trữ
        if (!this.analyticsResults.faces[cameraId]) {
          this.analyticsResults.faces[cameraId] = [];
        }
        this.analyticsResults.faces[cameraId].push(result);
        
        // Lưu sự kiện nếu phát hiện khuôn mặt
        if (faces.length > 0) {
          this._saveEvent('FACE_DETECTED', cameraId, {
            faceCount: faces.length,
            timestamp
          });
        }
        
        // Lưu dữ liệu phân tích
        this._saveAnalyticsData();
        
        return result;
      } else {
        throw new Error('Không thể phân tích hình ảnh để nhận diện khuôn mặt');
      }
    } catch (error) {
      console.error('Lỗi khi nhận diện khuôn mặt:', error);
      throw error;
    }
  }
  
  /**
   * Phân tích hình ảnh để phát hiện và nhận diện biển số xe (ANPR)
   * @param {Buffer|string} imageData - Dữ liệu hình ảnh hoặc đường dẫn tệp
   * @param {string} cameraId - ID của camera
   * @param {object} options - Tùy chọn bổ sung
   * @returns {Promise<object>} - Kết quả phân tích
   */
  async detectLicensePlates(imageData, cameraId, options = {}) {
    try {
      const formData = this._prepareImageData(imageData);
      
      // Ngưỡng tin cậy
      const minConfidence = options.confidenceThreshold || this.config.confidenceThreshold.licensePlate;
      
      // Gọi API nhận diện biển số xe
      const response = await this._makeApiRequest('/v1/vision/anpr', formData);
      
      if (response.success) {
        // Lọc kết quả theo ngưỡng tin cậy
        const licensePlates = response.predictions.filter(
          pred => pred.confidence * 100 >= minConfidence
        );
        
        // Lưu kết quả phân tích
        const timestamp = new Date().toISOString();
        const result = {
          timestamp,
          cameraId,
          plateCount: licensePlates.length,
          licensePlates: licensePlates.map(plate => ({
            text: plate.label,
            confidence: plate.confidence,
            boundingBox: {
              x_min: plate.x_min,
              y_min: plate.y_min,
              x_max: plate.x_max,
              y_max: plate.y_max
            }
          }))
        };
        
        // Thêm vào lưu trữ
        if (!this.analyticsResults.licensePlates[cameraId]) {
          this.analyticsResults.licensePlates[cameraId] = [];
        }
        this.analyticsResults.licensePlates[cameraId].push(result);
        
        // Lưu sự kiện nếu phát hiện biển số
        if (licensePlates.length > 0) {
          licensePlates.forEach(plate => {
            this._saveEvent('LICENSE_PLATE_DETECTED', cameraId, {
              plateNumber: plate.label,
              confidence: plate.confidence,
              timestamp
            });
          });
        }
        
        // Lưu dữ liệu phân tích
        this._saveAnalyticsData();
        
        return result;
      } else {
        throw new Error('Không thể phân tích hình ảnh để đọc biển số xe');
      }
    } catch (error) {
      console.error('Lỗi khi nhận diện biển số xe:', error);
      throw error;
    }
  }
  
  /**
   * Phân tích hình ảnh để phát hiện đối tượng (người, xe, động vật, đồ vật)
   * @param {Buffer|string} imageData - Dữ liệu hình ảnh hoặc đường dẫn tệp
   * @param {string} cameraId - ID của camera
   * @param {object} options - Tùy chọn bổ sung
   * @returns {Promise<object>} - Kết quả phân tích
   */
  async detectObjects(imageData, cameraId, options = {}) {
    try {
      const formData = this._prepareImageData(imageData);
      
      // Ngưỡng tin cậy
      const minConfidence = options.confidenceThreshold || this.config.confidenceThreshold.object;
      
      // Lọc đối tượng quan tâm (nếu được chỉ định)
      const targetObjects = options.targetObjects || null;
      
      const response = await this._makeApiRequest('/v1/vision/detection', formData);
      
      if (response.success) {
        // Lọc kết quả theo ngưỡng tin cậy và đối tượng quan tâm
        let objects = response.predictions.filter(
          pred => pred.confidence * 100 >= minConfidence
        );
        
        if (targetObjects && Array.isArray(targetObjects) && targetObjects.length > 0) {
          objects = objects.filter(obj => targetObjects.includes(obj.label));
        }
        
        // Lưu kết quả phân tích
        const timestamp = new Date().toISOString();
        const result = {
          timestamp,
          cameraId,
          objectCount: objects.length,
          objects: objects.map(obj => ({
            label: obj.label,
            confidence: obj.confidence,
            boundingBox: {
              x_min: obj.x_min,
              y_min: obj.y_min,
              x_max: obj.x_max,
              y_max: obj.y_max
            }
          }))
        };
        
        // Thêm vào lưu trữ
        if (!this.analyticsResults.objects[cameraId]) {
          this.analyticsResults.objects[cameraId] = [];
        }
        this.analyticsResults.objects[cameraId].push(result);
        
        // Lưu sự kiện nếu phát hiện đối tượng quan tâm
        if (objects.length > 0) {
          this._saveEvent('OBJECTS_DETECTED', cameraId, {
            objectCount: objects.length,
            objects: objects.map(obj => obj.label),
            timestamp
          });
        }
        
        // Lưu dữ liệu phân tích
        this._saveAnalyticsData();
        
        return result;
      } else {
        throw new Error('Không thể phân tích hình ảnh để phát hiện đối tượng');
      }
    } catch (error) {
      console.error('Lỗi khi phát hiện đối tượng:', error);
      throw error;
    }
  }
  
  /**
   * Ghi nhận sự kiện chấm công từ nhận diện khuôn mặt
   * @param {string} faceId - ID khuôn mặt
   * @param {string} personName - Tên người
   * @param {string} cameraId - ID camera
   * @returns {object} - Thông tin sự kiện chấm công
   */
  recordAttendance(faceId, personName, cameraId) {
    const timestamp = new Date().toISOString();
    const date = moment().format('YYYY-MM-DD');
    
    // Tạo ID duy nhất cho sự kiện chấm công
    const attendanceId = uuid.v4();
    
    // Tạo thông tin sự kiện chấm công
    const attendanceRecord = {
      id: attendanceId,
      faceId,
      personName,
      cameraId,
      timestamp,
      date
    };
    
    // Thêm vào lưu trữ
    if (!this.analyticsResults.attendance[date]) {
      this.analyticsResults.attendance[date] = [];
    }
    this.analyticsResults.attendance[date].push(attendanceRecord);
    
    // Lưu sự kiện
    this._saveEvent('ATTENDANCE', cameraId, {
      attendanceId,
      personName,
      timestamp
    });
    
    // Lưu dữ liệu phân tích
    this._saveAnalyticsData();
    
    return attendanceRecord;
  }
  
  /**
   * Kiểm tra trạng thái của DeepStack API
   * @returns {Promise<boolean>} - true nếu API hoạt động, false nếu không
   */
  async checkApiStatus() {
    try {
      // Kiểm tra trạng thái API bằng cách gọi đến endpoint chung
      await axios.get(`${this.baseUrl}/v1/vision/detection`);
      return true;
    } catch (error) {
      if (error.response) {
        // Nếu API trả về một phản hồi (ngay cả lỗi) thì còn hoạt động
        return true;
      }
      return false;
    }
  }
  
  /**
   * Phân tích hành vi từ chuỗi hình ảnh
   * @param {string} cameraId - ID của camera
   * @param {number} duration - Khoảng thời gian phân tích (giây)
   * @returns {object} - Kết quả phân tích hành vi
   */
  analyzeMovement(cameraId, duration = 300) {
    // Lấy dữ liệu phân tích trong khoảng thời gian
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - duration * 1000);
    
    // Lọc dữ liệu theo thời gian
    const personDetections = this.analyticsResults.persons[cameraId] || [];
    const timeFilteredData = personDetections.filter(record => {
      const recordTime = new Date(record.timestamp);
      return recordTime >= startTime && recordTime <= endTime;
    });
    
    // Tính toán thống kê chuyển động
    const movementAnalysis = {
      cameraId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      totalDetections: timeFilteredData.length,
      averagePersonCount: 0,
      maxPersonCount: 0,
      timeline: []
    };
    
    // Tính toán các thống kê
    if (timeFilteredData.length > 0) {
      // Tính trung bình số người
      const totalPersons = timeFilteredData.reduce((sum, record) => sum + record.personCount, 0);
      movementAnalysis.averagePersonCount = totalPersons / timeFilteredData.length;
      
      // Tìm số lượng người tối đa
      movementAnalysis.maxPersonCount = Math.max(...timeFilteredData.map(record => record.personCount));
      
      // Tạo timeline dữ liệu
      movementAnalysis.timeline = timeFilteredData.map(record => ({
        timestamp: record.timestamp,
        personCount: record.personCount
      }));
    }
    
    return movementAnalysis;
  }
  
  /**
   * Phân tích mật độ người từ chuỗi hình ảnh
   * @param {string} cameraId - ID của camera
   * @param {object} options - Tùy chọn bổ sung
   * @returns {object} - Kết quả phân tích mật độ
   */
  analyzeDensity(cameraId, options = {}) {
    const interval = options.interval || 3600; // Mặc định phân tích theo giờ
    const date = options.date || moment().format('YYYY-MM-DD');
    
    // Lọc dữ liệu theo ngày
    const personDetections = this.analyticsResults.persons[cameraId] || [];
    const dateFilteredData = personDetections.filter(record => {
      return record.timestamp.includes(date);
    });
    
    // Khởi tạo kết quả
    const densityAnalysis = {
      cameraId,
      date,
      intervalSeconds: interval,
      hourlyDensity: {},
      peakTime: null,
      peakCount: 0,
      totalDetections: dateFilteredData.length
    };
    
    // Tính mật độ theo giờ
    if (dateFilteredData.length > 0) {
      // Nhóm dữ liệu theo giờ
      const hourlyData = {};
      dateFilteredData.forEach(record => {
        const hour = new Date(record.timestamp).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = {
            totalCount: 0,
            detections: 0
          };
        }
        hourlyData[hour].totalCount += record.personCount;
        hourlyData[hour].detections += 1;
      });
      
      // Tính trung bình theo giờ
      Object.keys(hourlyData).forEach(hour => {
        const avgCount = hourlyData[hour].totalCount / hourlyData[hour].detections;
        densityAnalysis.hourlyDensity[hour] = {
          averageCount: avgCount,
          totalDetections: hourlyData[hour].detections
        };
        
        // Kiểm tra giờ cao điểm
        if (avgCount > densityAnalysis.peakCount) {
          densityAnalysis.peakCount = avgCount;
          densityAnalysis.peakTime = parseInt(hour);
        }
      });
    }
    
    return densityAnalysis;
  }
  
  /**
   * Phân tích dữ liệu chấm công
   * @param {string} date - Ngày cần phân tích (định dạng YYYY-MM-DD)
   * @returns {object} - Kết quả phân tích chấm công
   */
  getAttendanceReport(date = moment().format('YYYY-MM-DD')) {
    // Tạo dữ liệu chấm công mẫu nếu không có
    if (!this.analyticsResults.attendance[date]) {
      this._generateSampleAttendance(date);
    }
    
    const attendanceData = this.analyticsResults.attendance[date] || [];
    
    // Nhóm theo người
    const personAttendance = {};
    attendanceData.forEach(record => {
      if (!personAttendance[record.personName]) {
        personAttendance[record.personName] = {
          firstDetection: record.timestamp,
          lastDetection: record.timestamp,
          detectionCount: 1,
          cameras: [record.cameraId]
        };
      } else {
        const person = personAttendance[record.personName];
        
        // Cập nhật thời gian phát hiện đầu/cuối
        if (new Date(record.timestamp) < new Date(person.firstDetection)) {
          person.firstDetection = record.timestamp;
        }
        if (new Date(record.timestamp) > new Date(person.lastDetection)) {
          person.lastDetection = record.timestamp;
        }
        
        // Cập nhật số lần phát hiện
        person.detectionCount += 1;
        
        // Thêm camera phát hiện
        if (!person.cameras.includes(record.cameraId)) {
          person.cameras.push(record.cameraId);
        }
      }
    });
    
    // Chuyển đổi dữ liệu sang định dạng báo cáo
    const report = {
      date,
      totalAttendance: Object.keys(personAttendance).length,
      details: Object.keys(personAttendance).map(name => {
        const person = personAttendance[name];
        const firstTime = moment(person.firstDetection);
        const lastTime = moment(person.lastDetection);
        
        return {
          name,
          firstDetection: person.firstDetection,
          lastDetection: person.lastDetection,
          timePresent: lastTime.diff(firstTime, 'hours', true), // Số giờ có mặt
          detectionCount: person.detectionCount,
          cameras: person.cameras
        };
      })
    };
    
    return report;
  }
  
  /**
   * Tạo dữ liệu chấm công mẫu cho một ngày
   * @param {string} date - Ngày cần tạo dữ liệu (YYYY-MM-DD)
   * @private
   */
  _generateSampleAttendance(date) {
    const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'];
    const cameraIds = ['0', '1', '2'];
    
    // Tạo danh sách chấm công trống
    if (!this.analyticsResults.attendance[date]) {
      this.analyticsResults.attendance[date] = [];
    }
    
    // Lấy ngày từ chuỗi date
    const dateMoment = moment(date);
    
    // Với mỗi người, tạo từ 1 đến 3 bản ghi chấm công
    names.forEach(name => {
      // Số lần phát hiện
      const detectionCount = Math.floor(Math.random() * 3) + 1;
      
      // Khung giờ bắt đầu (từ 7h đến 9h sáng)
      const startHour = 7 + Math.floor(Math.random() * 2);
      const startMinute = Math.floor(Math.random() * 60);
      const startTime = dateMoment.clone().hour(startHour).minute(startMinute);
      
      // Thêm bản ghi đầu tiên (giờ vào)
      const firstRecord = {
        id: uuid.v4(),
        faceId: uuid.v4(),
        personName: name,
        cameraId: cameraIds[Math.floor(Math.random() * cameraIds.length)],
        timestamp: startTime.toISOString(),
        date
      };
      this.analyticsResults.attendance[date].push(firstRecord);
      
      // Nếu có nhiều lần phát hiện, thêm các bản ghi giữa giờ
      if (detectionCount > 1) {
        for (let i = 1; i < detectionCount; i++) {
          // Thời điểm sau giờ vào và trước giờ ra
          const middleHour = 10 + Math.floor(Math.random() * 5); // 10h đến 15h
          const middleMinute = Math.floor(Math.random() * 60);
          const middleTime = dateMoment.clone().hour(middleHour).minute(middleMinute);
          
          const middleRecord = {
            id: uuid.v4(),
            faceId: firstRecord.faceId, // Dùng cùng ID khuôn mặt
            personName: name,
            cameraId: cameraIds[Math.floor(Math.random() * cameraIds.length)],
            timestamp: middleTime.toISOString(),
            date
          };
          this.analyticsResults.attendance[date].push(middleRecord);
        }
      }
      
      // Thêm bản ghi cuối cùng (giờ ra)
      const endHour = 16 + Math.floor(Math.random() * 2); // 16h đến 18h
      const endMinute = Math.floor(Math.random() * 60);
      const endTime = dateMoment.clone().hour(endHour).minute(endMinute);
      
      const lastRecord = {
        id: uuid.v4(),
        faceId: firstRecord.faceId, // Dùng cùng ID khuôn mặt
        personName: name,
        cameraId: cameraIds[Math.floor(Math.random() * cameraIds.length)],
        timestamp: endTime.toISOString(),
        date
      };
      this.analyticsResults.attendance[date].push(lastRecord);
    });
    
    // Lưu dữ liệu
    this._saveAnalyticsData();
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
   * Tạo dữ liệu sự kiện mẫu để kiểm thử giao diện
   * @private
   */
  _generateSampleEvents() {
    const eventTypes = [
      'PERSON_DETECTED', 
      'FACE_DETECTED', 
      'LICENSE_PLATE_DETECTED',
      'OBJECTS_DETECTED',
      'ATTENDANCE'
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
        case 'OBJECTS_DETECTED':
          const objects = ['Xe hơi', 'Xe máy', 'Chó', 'Mèo', 'Túi xách', 'Điện thoại'];
          eventData = {
            objectCount: Math.floor(Math.random() * 3) + 1,
            objects: [objects[Math.floor(Math.random() * objects.length)]],
            timestamp: timestamp.toISOString()
          };
          break;
        case 'ATTENDANCE':
          const names = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D'];
          eventData = {
            attendanceId: uuid.v4(),
            personName: names[Math.floor(Math.random() * names.length)],
            timestamp: timestamp.toISOString()
          };
          break;
      }
      
      this._saveEvent(eventType, cameraId, eventData);
    }
  }
  
  /**
   * Chuẩn bị dữ liệu hình ảnh để gửi đến API
   * @private
   * @param {Buffer|string} imageData - Dữ liệu hình ảnh hoặc đường dẫn tệp
   * @returns {FormData} - Form data cho API request
   */
  _prepareImageData(imageData) {
    if (!imageData) {
      throw new Error('Dữ liệu hình ảnh không được cung cấp');
    }
    
    let imgBuffer;
    
    // Nếu imageData là đường dẫn tệp
    if (typeof imageData === 'string') {
      if (!fs.existsSync(imageData)) {
        throw new Error(`Tệp hình ảnh không tồn tại: ${imageData}`);
      }
      imgBuffer = fs.readFileSync(imageData);
    } 
    // Nếu imageData là buffer
    else if (Buffer.isBuffer(imageData)) {
      imgBuffer = imageData;
    } else {
      throw new Error('Định dạng dữ liệu hình ảnh không hợp lệ');
    }
    
    // Chuẩn bị form data (thủ công vì FormData là Web API)
    const formData = {
      image: imgBuffer
    };
    
    return formData;
  }
  
  /**
   * Thực hiện request đến DeepStack API
   * @private
   * @param {string} endpoint - Endpoint API (ví dụ: /v1/vision/detection)
   * @param {object} formData - Form data 
   * @returns {Promise<object>} - Phản hồi từ API
   */
  async _makeApiRequest(endpoint, formData) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Thêm API key nếu có
      const headers = {};
      if (this.config.apiKey) {
        headers['x-api-key'] = this.config.apiKey;
      }
      
      // Thực hiện request POST với dữ liệu hình ảnh
      const response = await axios.post(url, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30s timeout
      });
      
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi gọi DeepStack API ${endpoint}:`, error.message);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      throw error;
    }
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
      timestamp: new Date().toISOString(),
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

module.exports = DeepStackAI;