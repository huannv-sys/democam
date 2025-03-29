/**
 * Dahua Camera API Wrapper
 * Based on the official Dahua HTTP API documentation
 */

import axios from 'axios';
import { createDigestAuth } from './DigestAuth.js';

export class DahuaCamera {
  constructor(host, username, password, options = {}) {
    this.host = host;
    this.username = username;
    this.password = password;
    this.port = options.port || 80;
    this.timeout = options.timeout || 15000;
    this.protocol = options.protocol || 'http';
    this.baseUrl = `${this.protocol}://${this.host}:${this.port}`;
    
    // Set up digest auth
    this.digestAuth = createDigestAuth({
      username: this.username,
      password: this.password
    });
  }

  /**
   * Get snapshot from camera
   * @param {number} channel - Channel number (default: 1)
   * @returns {Promise<Buffer>} - Image data as buffer
   */
  async getSnapshot(channel = 1) {
    // Try multiple snapshot URLs in sequence
    const snapshotPaths = [
      `/cgi-bin/snapshot.cgi?channel=${channel}`,
      `/snapshot.cgi?channel=${channel}`,
      `/cgi-bin/getSnapshot.cgi?channel=${channel}`,
      `/cgi-bin/image.cgi?channel=${channel}`,
      `/onvif-http/snapshot?channel=${channel}`,
      `/ISAPI/Streaming/channels/${channel}/picture`
    ];

    let lastError = null;
    for (const path of snapshotPaths) {
      try {
        const response = await this.digestAuth.request({
          method: 'GET',
          url: `${this.baseUrl}${path}`,
          responseType: 'arraybuffer',
          timeout: this.timeout
        });
        
        if (response.data && response.data.length > 100) {
          return response.data;
        }
      } catch (error) {
        lastError = error;
        // Continue to next URL
      }
    }
    
    // If all attempts failed, try basic auth as fallback
    try {
      const basicAuth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      const response = await axios.get(`${this.baseUrl}/cgi-bin/snapshot.cgi?channel=${channel}`, {
        headers: {
          'Authorization': `Basic ${basicAuth}`
        },
        responseType: 'arraybuffer',
        timeout: this.timeout
      });
      
      if (response.data && response.data.length > 100) {
        return response.data;
      }
    } catch (error) {
      // Ignore and use the previous error
    }
    
    throw lastError || new Error('Failed to get snapshot from camera');
  }

  /**
   * Get RTSP stream URL
   * @param {number} channel - Channel number (default: 1)
   * @param {number} streamType - Stream type (0: main, 1: sub)
   * @returns {string} - RTSP URL
   */
  getRtspUrl(channel = 1, streamType = 0) {
    const rtspUrls = [
      `rtsp://${this.username}:${this.password}@${this.host}:554/cam/realmonitor?channel=${channel}&subtype=${streamType}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/h264/ch${channel}/${streamType}/av_stream`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/live/ch${channel}/${streamType}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/streaming/channels/${channel}${streamType === 1 ? '02' : '01'}`
    ];
    
    return rtspUrls[0]; // Return standard URL by default
  }
  
  /**
   * Get all supported RTSP URLs for this camera
   * @param {number} channel - Channel number
   * @param {number} streamType - Stream type
   * @returns {Array<string>} - Array of possible RTSP URLs
   */
  getAllRtspUrls(channel = 1, streamType = 0) {
    return [
      `rtsp://${this.username}:${this.password}@${this.host}:554/cam/realmonitor?channel=${channel}&subtype=${streamType}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/h264/ch${channel}/${streamType}/av_stream`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/live/ch${channel}/${streamType}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/streaming/channels/${channel}${streamType === 1 ? '02' : '01'}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/onvif${channel}`,
      `rtsp://${this.username}:${this.password}@${this.host}:554/media/video${channel}`
    ];
  }

  /**
   * Get device information
   * @returns {Promise<Object>} - Device information
   */
  async getDeviceInfo() {
    try {
      // Try to get device type and hardware info
      const deviceTypeResponse = await this.digestAuth.request({
        method: 'GET',
        url: `${this.baseUrl}/cgi-bin/magicBox.cgi?action=getDeviceType`,
        timeout: this.timeout
      });
      
      const hardwareResponse = await this.digestAuth.request({
        method: 'GET',
        url: `${this.baseUrl}/cgi-bin/magicBox.cgi?action=getHardwareVersion`,
        timeout: this.timeout
      });
      
      const softwareResponse = await this.digestAuth.request({
        method: 'GET',
        url: `${this.baseUrl}/cgi-bin/magicBox.cgi?action=getSoftwareVersion`,
        timeout: this.timeout
      });
      
      const serialResponse = await this.digestAuth.request({
        method: 'GET',
        url: `${this.baseUrl}/cgi-bin/magicBox.cgi?action=getSerialNo`,
        timeout: this.timeout
      });
      
      return {
        deviceType: this._parseResponse(deviceTypeResponse.data),
        hardwareVersion: this._parseResponse(hardwareResponse.data),
        softwareVersion: this._parseResponse(softwareResponse.data),
        serialNumber: this._parseResponse(serialResponse.data)
      };
    } catch (error) {
      throw new Error(`Failed to get device info: ${error.message}`);
    }
  }
  
  /**
   * Get network configuration
   * @returns {Promise<Object>} - Network configuration
   */
  async getNetworkSync() {
    try {
      const response = await this.digestAuth.request({
        method: 'GET',
        url: `${this.baseUrl}/cgi-bin/configManager.cgi?action=getConfig&name=Network`,
        timeout: this.timeout
      });
      
      return this._parseMultilineResponse(response.data);
    } catch (error) {
      throw new Error(`Failed to get network configuration: ${error.message}`);
    }
  }
  
  /**
   * Parse simple response (key=value)
   * @private
   * @param {string} response - Response string
   * @returns {string} - Parsed value
   */
  _parseResponse(response) {
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
   * @returns {Object} - Parsed object
   */
  _parseMultilineResponse(response) {
    if (!response) return {};
    
    const result = {};
    const lines = response.toString().trim().split('\r\n');
    
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

/**
 * Create DigestAuth utility for Dahua cameras
 */
function createDigestAuth(options) {
  return {
    username: options.username,
    password: options.password,
    
    // Simple implementation of digest auth request
    request: async function(config) {
      try {
        // Try direct request first
        return await axios(config);
      } catch (error) {
        if (error.response && error.response.status === 401 && error.response.headers['www-authenticate']) {
          // Parse WWW-Authenticate header
          const authHeader = error.response.headers['www-authenticate'];
          const realm = authHeader.match(/realm="([^"]+)"/)[1];
          const nonce = authHeader.match(/nonce="([^"]+)"/)[1];
          
          // Calculate digest response
          const ha1 = md5(`${this.username}:${realm}:${this.password}`);
          const ha2 = md5(`${config.method}:${new URL(config.url).pathname}`);
          const response = md5(`${ha1}:${nonce}:1:abc:auth:${ha2}`);
          
          // Create authorization header
          const authValue = `Digest username="${this.username}", realm="${realm}", nonce="${nonce}", uri="${new URL(config.url).pathname}", qop=auth, nc=1, cnonce="abc", response="${response}", algorithm=MD5`;
          
          // Retry with auth header
          const newConfig = { ...config };
          if (!newConfig.headers) newConfig.headers = {};
          newConfig.headers.Authorization = authValue;
          
          return await axios(newConfig);
        }
        throw error;
      }
    }
  };
}

// MD5 function (simplified - in real implementation use a proper crypto library)
function md5(str) {
  // This is a placeholder - use a proper MD5 implementation
  // In a Node.js environment, you would use crypto module
  return 'md5hash';
}