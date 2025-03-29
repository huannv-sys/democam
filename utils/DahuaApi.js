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
    const snapshotPaths = [
      `/cgi-bin/snapshot.cgi?channel=${channel}`,
      `/snapshot.cgi?channel=${channel}`,
      `/cgi-bin/getSnapshot.cgi?channel=${channel}`,
      `/cgi-bin/image.cgi?channel=${channel}`,
      `/onvif-http/snapshot?channel=${channel}`,
      `/ISAPI/Streaming/channels/${channel}/picture`
    ];
    
    let lastError = null;
    
    // Try with digest auth first
    for (const path of snapshotPaths) {
      try {
        console.log(`Thử lấy snapshot từ: ${this.baseUrl}${path}`);
        const response = await this.digestAuth.request({
          method: 'GET',
          url: `${this.baseUrl}${path}`,
          responseType: 'arraybuffer',
          timeout: this.timeout
        });
        
        if (response.data && response.data.length > 100) {
          console.log(`Snapshot thành công từ ${path}`);
          return response.data;
        } else {
          console.warn(`Snapshot nhận được từ ${path} không hợp lệ, kích thước: ${response.data ? response.data.length : 0} bytes`);
        }
      } catch (error) {
        console.error(`Lỗi khi lấy snapshot từ ${path}:`, error.message);
        lastError = error;
      }
    }
    
    // If digest auth failed, try with basic auth
    for (const path of snapshotPaths) {
      try {
        console.log(`Thử lại snapshot với Basic Auth: ${this.baseUrl}${path}`);
        const response = await axios.get(`${this.baseUrl}${path}`, {
          headers: {
            'Authorization': `Basic ${this.basicAuth}`
          },
          responseType: 'arraybuffer',
          timeout: this.timeout
        });
        
        if (response.data && response.data.length > 100) {
          console.log(`Snapshot với Basic Auth thành công từ ${path}`);
          return response.data;
        }
      } catch (error) {
        console.error(`Lỗi khi lấy snapshot với Basic Auth từ ${path}:`, error.message);
      }
    }
    
    // If we reached here, all attempts failed
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
    return [
      `rtsp://${this.username}:${this.password}@${this.host}:554/cam/realmonitor?channel=${channel}&subtype=${streamType}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/cam/realmonitor?channel=${channel+1}&subtype=${streamType}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/h264/ch${channel}/${streamType}/av_stream`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/live/ch${channel}/${streamType}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/streaming/channels/${channel}${streamType === 1 ? '02' : '01'}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/onvif${channel}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/Streaming/Channels/${channel}${streamType === 1 ? '02' : '01'}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/stream${channel}`
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