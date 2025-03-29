/**
 * A simple Digest Authentication implementation for Dahua cameras
 * Based on the axios-digest-auth library
 */

const axios = require('axios');
const crypto = require('crypto');

/**
 * Create a digest auth client for Dahua cameras
 * @param {object} options - Configuration options
 * @param {string} options.username - Username for authentication
 * @param {string} options.password - Password for authentication 
 * @returns {object} - Digest auth client
 */
function createDigestAuth(options) {
  const username = options.username;
  const password = options.password;
  let nc = 0;
  let lastHA1 = null;

  return {
    /**
     * Make authenticated request with digest auth
     * @param {object} config - Axios request config
     * @returns {Promise<object>} - Axios response
     */
    request: async function(config) {
      try {
        // First try a direct request (might work if no auth needed or session exists)
        return await axios(config);
      } catch (error) {
        if (error.response && error.response.status === 401 && error.response.headers['www-authenticate']) {
          // Parse WWW-Authenticate header
          const authHeader = error.response.headers['www-authenticate'];
          
          // Extract digest auth parameters
          const realm = (authHeader.match(/realm="([^"]+)"/) || [])[1];
          const nonce = (authHeader.match(/nonce="([^"]+)"/) || [])[1];
          const qop = (authHeader.match(/qop="([^"]+)"/) || [])[1] || 'auth';
          const algorithm = (authHeader.match(/algorithm="([^"]+)"/) || [])[1] || 'MD5';
          const opaque = (authHeader.match(/opaque="([^"]+)"/) || [])[1];
          
          if (!realm || !nonce) {
            throw new Error('Invalid WWW-Authenticate header');
          }
          
          // Increment nonce count
          nc++;
          const ncValue = ('00000000' + nc).slice(-8);
          
          // Generate cnonce
          const cnonce = crypto.randomBytes(16).toString('hex');
          
          // Calculate digest components
          const ha1 = lastHA1 || md5(`${username}:${realm}:${password}`);
          lastHA1 = ha1; // cache HA1 for subsequent requests to same realm
          
          const uri = new URL(config.url).pathname + (new URL(config.url).search || '');
          const ha2 = md5(`${config.method.toUpperCase()}:${uri}`);
          
          // Calculate response
          let digestResponse;
          if (qop) {
            digestResponse = md5(`${ha1}:${nonce}:${ncValue}:${cnonce}:${qop}:${ha2}`);
          } else {
            digestResponse = md5(`${ha1}:${nonce}:${ha2}`);
          }
          
          // Build Authorization header
          let authValue = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", algorithm=${algorithm}`;
          
          if (qop) {
            authValue += `, qop=${qop}, nc=${ncValue}, cnonce="${cnonce}"`;
          }
          
          authValue += `, response="${digestResponse}"`;
          
          if (opaque) {
            authValue += `, opaque="${opaque}"`;
          }
          
          // Retry with auth header
          const newConfig = { ...config };
          if (!newConfig.headers) newConfig.headers = {};
          newConfig.headers.Authorization = authValue;
          
          try {
            return await axios(newConfig);
          } catch (retryError) {
            console.error('Digest auth failed:', retryError.message);
            throw retryError;
          }
        }
        
        throw error;
      }
    }
  };
}

/**
 * Calculate MD5 hash
 * @param {string} data - String to hash
 * @returns {string} - MD5 hash
 */
function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

// Export the functions
module.exports = { createDigestAuth, md5 };