/**
 * Enhanced Dahua Camera API module
 * Based on insights from DAHUA-ANPR repository and official API docs
 */

const axios = require('axios');
const { createDigestAuth } = require('./DigestAuth.js');

/**
 * Dahua API client for interacting with Dahua cameras
 */
class DahuaApi {
  /**
   * Create a new Dahua API client
   * @param {object} options - Camera connection options
   * @param {string} options.host - Camera hostname or IP address
   * @param {string} options.username - Username for authentication
   * @param {string} options.password - Password for authentication
   * @param {number} options.port - HTTP port (default: 80)
   * @param {string} options.protocol - Protocol (default: 'http')
   * @param {number} options.timeout - Request timeout in ms (default: 8000)
   */
  constructor(options) {
    this.host = options.host;
    this.username = options.username;
    this.password = options.password;
    this.port = options.port || 80;
    this.protocol = options.protocol || 'http';
    this.timeout = options.timeout || 8000;
    this.baseUrl = `${this.protocol}://${this.host}:${this.port}`;
    
    // Setup digest auth
    this.digestAuth = createDigestAuth({
      username: this.username,
      password: this.password
    });
    
    // Create basic auth header for backup
    this.basicAuth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
  }
  
  /**
   * Get a snapshot from the camera
   * @param {number} channel - Channel number (default: 1)
   * @returns {Promise<Buffer>} - Image data
   */
  async getSnapshot(channel = 1) {
    // Try multiple snapshot URLs with digest auth
    // Thêm nhiều đường dẫn hơn và các biến thể khác nhau
    const snapshotPaths = [
      `/cgi-bin/snapshot.cgi?channel=${channel}`,
      `/snapshot.cgi?channel=${channel}`,
      `/cgi-bin/getSnapshot.cgi?channel=${channel}`,
      `/cgi-bin/image.cgi?channel=${channel}`,
      `/onvif-http/snapshot?channel=${channel}`,
      `/ISAPI/Streaming/channels/${channel}/picture`,
      `/ISAPI/Streaming/channels/${channel}01/picture`,
      `/webcapture.jpg?channel=${channel}`,
      `/cgi-bin/jpeg/channel${channel}`,
      `/cgi-bin/camera.cgi?channel=${channel}`,
      `/cgi-bin/snapshot.cgi`, // Thử không có tham số kênh
      `/snapshot.cgi`,         // Thử không có tham số kênh
      `/cgi-bin/snapManager.cgi?action=attachFileProc&channel=${channel}`,
      `/cgi-bin/mjpg/snapshot.cgi?chn=${channel}`,
      `/cgi-bin/mjpg/video.cgi?channel=${channel}&subtype=1`,
      `/cgi-bin/snapshot.jpg?channel=${channel}`
    ];
    
    let lastError = null;
    
    // Tăng thời gian timeout cho snapshot
    const snapshotTimeout = this.timeout * 2;
    
    // Thử với Digest Auth trước
    for (const path of snapshotPaths) {
      try {
        console.log(`Thử lấy snapshot từ: ${this.baseUrl}${path}`);
        const response = await this.digestAuth.request({
          method: 'GET',
          url: `${this.baseUrl}${path}`,
          responseType: 'arraybuffer',
          timeout: snapshotTimeout,
          // Thêm header để cải thiện khả năng thành công
          headers: {
            'Accept': 'image/jpeg,image/*;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Kiểm tra kỹ lưỡng hơn dữ liệu hình ảnh
        if (response.data && 
            response.data.length > 100 && 
            response.headers['content-type'] && 
            response.headers['content-type'].includes('image')) {
          console.log(`Snapshot thành công từ ${path}`);
          return response.data;
        } else {
          console.warn(`Snapshot nhận được từ ${path} không hợp lệ, kích thước: ${response.data ? response.data.length : 0} bytes, content-type: ${response.headers['content-type'] || 'không xác định'}`);
        }
      } catch (error) {
        console.error(`Lỗi khi lấy snapshot từ ${path}:`, error.message);
        lastError = error;
      }
    }
    
    // Nếu Digest Auth thất bại, thử với Basic Auth
    for (const path of snapshotPaths) {
      try {
        console.log(`Thử lại snapshot với Basic Auth: ${this.baseUrl}${path}`);
        const response = await axios.get(`${this.baseUrl}${path}`, {
          headers: {
            'Authorization': `Basic ${this.basicAuth}`,
            'Accept': 'image/jpeg,image/*;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          responseType: 'arraybuffer',
          timeout: snapshotTimeout
        });
        
        // Kiểm tra response có đúng là hình ảnh không
        if (response.data && 
            response.data.length > 100 && 
            response.headers['content-type'] && 
            response.headers['content-type'].includes('image')) {
          console.log(`Snapshot với Basic Auth thành công từ ${path}`);
          return response.data;
        }
      } catch (error) {
        console.error(`Lỗi khi lấy snapshot với Basic Auth từ ${path}:`, error.message);
      }
    }
    
    // Thử không dùng xác thực (một số camera có thể cho phép truy cập ẩn danh)
    for (const path of snapshotPaths) {
      try {
        console.log(`Thử lấy snapshot không cần xác thực: ${this.baseUrl}${path}`);
        const response = await axios.get(`${this.baseUrl}${path}`, {
          responseType: 'arraybuffer',
          timeout: snapshotTimeout,
          headers: {
            'Accept': 'image/jpeg,image/*;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.data && 
            response.data.length > 100 && 
            response.headers['content-type'] && 
            response.headers['content-type'].includes('image')) {
          console.log(`Snapshot không xác thực thành công từ ${path}`);
          return response.data;
        }
      } catch (error) {
        console.error(`Lỗi khi lấy snapshot không xác thực từ ${path}:`, error.message);
      }
    }
    
    // Nếu đã thử tất cả các phương pháp mà không thành công
    throw lastError || new Error('Không thể lấy snapshot từ camera');
  }
  
  /**
   * Get device information
   * @returns {Promise<object>} - Device information
   */
  async getDeviceInfo() {
    try {
      const deviceType = await this._getRequest('/cgi-bin/magicBox.cgi?action=getDeviceType');
      const hardwareVersion = await this._getRequest('/cgi-bin/magicBox.cgi?action=getHardwareVersion');
      const softwareVersion = await this._getRequest('/cgi-bin/magicBox.cgi?action=getSoftwareVersion');
      const serialNumber = await this._getRequest('/cgi-bin/magicBox.cgi?action=getSerialNo');
      
      return {
        deviceType: this._parseKeyValueResponse(deviceType),
        hardwareVersion: this._parseKeyValueResponse(hardwareVersion),
        softwareVersion: this._parseKeyValueResponse(softwareVersion),
        serialNumber: this._parseKeyValueResponse(serialNumber)
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy thông tin thiết bị: ${error.message}`);
    }
  }
  
  /**
   * Get network configuration
   * @returns {Promise<object>} - Network configuration
   */
  async getNetworkConfig() {
    try {
      const response = await this._getRequest('/cgi-bin/configManager.cgi?action=getConfig&name=Network');
      return this._parseMultilineResponse(response);
    } catch (error) {
      throw new Error(`Lỗi khi lấy cấu hình mạng: ${error.message}`);
    }
  }
  
  /**
   * Get all possible RTSP URLs for this camera
   * @param {number} channel - Channel number (default: 1)
   * @param {number} streamType - Stream type (0: main, 1: sub) (default: 0)
   * @returns {Array<string>} - Array of possible RTSP URLs
   */
  getRtspUrls(channel = 1, streamType = 0) {
    // Thêm nhiều định dạng URL RTSP hơn để thử
    return [
      // Định dạng phổ biến nhất cho Dahua
      `rtsp://${this.username}:${this.password}@${this.host}:554/cam/realmonitor?channel=${channel}&subtype=${streamType}`,
      
      // Định dạng thay thế với các biến thể channel khác nhau
      `rtsp://${this.username}:${this.password}@${this.host}:554/cam/realmonitor?channel=${channel+1}&subtype=${streamType}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/cam/realmonitor?channel=${channel}&subtype=${streamType === 0 ? 1 : 0}`,
      
      // Các định dạng NVR/DVR khác của Dahua
      `rtsp://${this.username}:${this.password}@${this.host}:554/h264/ch${channel}/${streamType}/av_stream`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/h264/ch${channel+1}/${streamType}/av_stream`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/live/ch${channel}/${streamType}`,
      
      // Định dạng cho camera Dahua IPC
      `rtsp://${this.username}:${this.password}@${this.host}:554/cam/playback?channel=${channel}`,
      
      // Định dạng Onvif tương thích
      `rtsp://${this.username}:${this.password}@${this.host}:554/streaming/channels/${channel}${streamType === 1 ? '02' : '01'}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/onvif${channel}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/Streaming/Channels/${channel}${streamType === 1 ? '02' : '01'}`,
      
      // Định dạng đơn giản
      `rtsp://${this.username}:${this.password}@${this.host}:554/stream${channel}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/ch${channel}_${streamType}`,
      
      // Định dạng cho camera Dahua PTZ
      `rtsp://${this.username}:${this.password}@${this.host}:554/ptz/ch${channel}/${streamType}`,
      
      // Định dạng cổ điển
      `rtsp://${this.username}:${this.password}@${this.host}:554/video${channel}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/media${channel}`,
      
      // Thử với các cổng RTSP khác
      `rtsp://${this.username}:${this.password}@${this.host}:1554/cam/realmonitor?channel=${channel}&subtype=${streamType}`,
      `rtsp://${this.username}:${this.password}@${this.host}:10554/cam/realmonitor?channel=${channel}&subtype=${streamType}`,
      
      // Thử URL không có thông tin xác thực
      `rtsp://${this.host}:554/cam/realmonitor?channel=${channel}&subtype=${streamType}`
    ];
  }
  
  /**
   * Helper method to make GET requests with digest auth
   * @private
   * @param {string} path - Request path
   * @returns {Promise<string>} - Response body as string
   */
  async _getRequest(path) {
    try {
      const response = await this.digestAuth.request({
        method: 'GET',
        url: `${this.baseUrl}${path}`,
        timeout: this.timeout
      });
      return response.data;
    } catch (error) {
      // Try with basic auth if digest fails
      try {
        const response = await axios.get(`${this.baseUrl}${path}`, {
          headers: {
            'Authorization': `Basic ${this.basicAuth}`
          },
          timeout: this.timeout
        });
        return response.data;
      } catch (basicError) {
        throw error; // Throw the original error
      }
    }
  }
  
  /**
   * Parse simple key=value response
   * @private
   * @param {string} response - Response string
   * @returns {string} - Parsed value
   */
  _parseKeyValueResponse(response) {
    if (!response) return null;
    
    const str = response.toString().trim();
    const index = str.indexOf('=');
    
    if (index > -1) {
      return str.substring(index + 1);
    }
    
    return str;
  }
  
  /**
   * Parse multiline response
   * @private
   * @param {string} response - Response string
   * @returns {object} - Parsed object
   */
  _parseMultilineResponse(response) {
    if (!response) return {};
    
    const result = {};
    const lines = response.toString().trim().split(/\r?\n/);
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const index = trimmed.indexOf('=');
      if (index > -1) {
        const key = trimmed.substring(0, index);
        const value = trimmed.substring(index + 1);
        result[key] = value;
      }
    }
    
    return result;
  }
}

// Export DahuaApi
module.exports = { DahuaApi };