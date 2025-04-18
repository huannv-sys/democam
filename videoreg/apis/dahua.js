const axios = require("axios");
const axios_digest = require("@mhoc/axios-digest-auth");
const https = require('https');

const timeout = 5000;

// обычно это yyyy=XXXXX, где ХХХХХ - это то что нам нужно
function single_line_resp(str) {
  const index = str.indexOf("=");
  return str.substring(index+1);
}

// обычно это yyyy=XXXXX \n yyyy=XXXXX, нужно распарсить в объект
function several_lines_simple_resp(str) {
  let ret = {};
  const lines = str.split("\r\n");
  for (const line of lines) {
    const fin_line = line.trim();
    if (fin_line === "") continue;

    const index = fin_line.indexOf("=");
    const val = fin_line.substring(index+1);
    const key = fin_line.substring(0, index);
    ret[key] = val;
  }

  return ret;
}

// по идее это обобщенная функция, которая может обработать любой вывод из дахуа камер
function parse_output(str) {
  let ret = {};
  const lines = str.trim().split("\r\n");
  if (lines.length === 1) return single_line_resp(str);
  if (lines.length === 2 && lines[1].trim() === "") return single_line_resp(str);

  for (const line of lines) {
    const fin_line = line.trim();
    if (fin_line === "") continue;

    //console.log(fin_line);
    let parts = fin_line.split("=");
    const path = parts.shift();
    const data = parts.join("=");
    const dots = path.split(".");
    let last_key = "";
    let prev = undefined;
    let cur = ret;
    for (let i = 0; i < dots.length; ++i) {
      const fin_key = dots[i].trim();
      if (fin_key === "") continue;

      //console.log(fin_key);
      const last_key = i === dots.length-1;
      const index_open = fin_key.indexOf("[");
      if (index_open < 0) {
        if (!cur[fin_key]) last_key ? cur[fin_key] = data : cur[fin_key] = {};
        prev = cur;
        cur = cur[fin_key];
        //console.log(ret);
        continue;
      }

      const index_close = fin_key.indexOf("]");
      if (index_close < 0) throw `Could not find ']' in key '${fin_key}'`;

      const final_key = fin_key.substring(0, index_open);
      const index = parseInt(fin_key.substring(index_open+1, index_close));
      if (isNaN(index)) throw `Could not parse index in key '${fin_key}'`;

      // проще сделать объектом?
      if (!cur[final_key]) cur[final_key] = [];
      while (cur[final_key].length <= index) {
        cur[final_key].push({});
      }

      if (last_key) cur[final_key][index] = data;
      prev = cur;
      cur = cur[final_key][index];
      //console.log(ret);
    }

    //cur = data;
    //console.log(ret);
  }

  const arr = Object.entries(ret);
  if (arr.length === 1) return arr[0][1]; // [ [ key, value ], [ key, value ] ... ]
  return ret;
}

async function make_sane_return(func) {
  try {
    return { data: await func(), status: { code: 200, desc: "Ok" } };
  } catch (e) {
    if (e.errno) {
      return { data: undefined, status: { code: e.errno, desc: e.code } }
    }

    if (e.response) {
      return { data: undefined, status: { code: e.response.status, desc: e.response.statusText } }
    }

    //console.log(e);
    //return { data: undefined, status: { code: -1, desc: "Undefined error" } }
    if (typeof e.code === "string") {
      return { data: undefined, status: { code: -1, desc: `${e.code} ${e.reason}` } }
    }

    if (e.message && e.message === "canceled") {
      return { data: undefined, status: { code: -2, desc: e.message } }
    }

    throw e;
  }
}

const protocol_port = {
  http: 80,
  https: 443,

};

function str_exists(str) { return str && str !== ""; }

let dahua = function(options) {
  this.TRACE = options.log;
  // короч протокол нужно поменять если устройство с самоподписанным сертификатом
  // понять что тут самоподписанный сертификат довольно сложно пока не спросишь чего нибудь у рега
  this.PROTOCOL = str_exists(options.protocol) ? options.protocol : "http";
  this.PORT = str_exists(options.port) ? options.port : (protocol_port[this.PROTOCOL] ? protocol_port[this.PROTOCOL] : 80);
  this.HOST = options.host;
  this.BASEURI = this.PROTOCOL + "://" + options.host + ':' + this.PORT;
  this.USER = options.user;
  this.PASS = options.pass;

  this.digest_auth = new axios_digest.default({
    username: this.USER,
    password: this.PASS,
  });
}

function make_proto_method(obj, name, url, parse_func) {
  obj.prototype[name] = async function() {
    const self = this;
    return await make_sane_return(async function() {
      const httpsAgent = this.PROTOCOL === "https" ? new https.Agent({ rejectUnauthorized: false }) : undefined;
      //console.log(url);
      const response = await self.digest_auth.request({
        method: "GET",
        url: self.BASEURI + url,
        httpsAgent,
        signal: AbortSignal.timeout(timeout),
        timeout: timeout,
      });

      //console.log(response);
      if (typeof response.data !== "string") {
        throw { response: { status: response.data.Ret, statusText: response.data.Tip } };
      }

      if (typeof response.data === "string" && 
         (response.data.indexOf("The requested URL was not found on this server") !== -1 || 
          response.data.indexOf("404 File Not Found") !== -1)) {
        throw { response: { status: 404, statusText: "File Not Found" } };
      }

      if (response.request.path !== url) {
        throw { response: { status: 404, statusText: "Path Not Found" } };
      }

      return parse_func(response.data.trim());
    });
  };
}

dahua.prototype.host = function() { return this.HOST; };
dahua.prototype.type = function() { return "dahua"; };

make_proto_method(dahua, "get_software_version", '/cgi-bin/magicBox.cgi?action=getSoftwareVersion', parse_output);
make_proto_method(dahua, "get_hardware_version", '/cgi-bin/magicBox.cgi?action=getHardwareVersion', parse_output);
make_proto_method(dahua, "get_device_type", '/cgi-bin/magicBox.cgi?action=getDeviceType', parse_output);
make_proto_method(dahua, "get_serial_no", '/cgi-bin/magicBox.cgi?action=getSerialNo', parse_output);
make_proto_method(dahua, "get_machine_name", '/cgi-bin/magicBox.cgi?action=getMachineName', parse_output);
make_proto_method(dahua, "get_system_info", '/cgi-bin/magicBox.cgi?action=getSystemInfo', parse_output);
make_proto_method(dahua, "get_device_class", `/cgi-bin/magicBox.cgi?action=getDeviceClass`, parse_output);
make_proto_method(dahua, "get_channel_title", `/cgi-bin/configManager.cgi?action=getConfig&name=ChannelTitle`, parse_output);
make_proto_method(dahua, "get_general_config", '/cgi-bin/configManager.cgi?action=getConfig&name=General', parse_output);

make_proto_method(dahua, "get_hard_disk_info", '/cgi-bin/storageDevice.cgi?action=factory.getPortInfo', parse_output);
make_proto_method(dahua, "get_storage_names", '/cgi-bin/storageDevice.cgi?action=factory.getCollect', parse_output);
make_proto_method(dahua, "get_storage_info", '/cgi-bin/storageDevice.cgi?action=getDeviceAllInfo', parse_output);
make_proto_method(dahua, "get_storage_caps", '/cgi-bin/storage.cgi?action=getCaps', parse_output);
make_proto_method(dahua, "get_record_storage_point", '/cgi-bin/configManager.cgi?action=getConfig&name=RecordStoragePoint', parse_output);
make_proto_method(dahua, "get_storage_group", '/cgi-bin/configManager.cgi?action=getConfig&name=StorageGroup', parse_output);

make_proto_method(dahua, "get_record_caps", '/cgi-bin/recordManager.cgi?action=getCaps', parse_output);
make_proto_method(dahua, "get_record_info", '/cgi-bin/configManager.cgi?action=getConfig&name=Record', parse_output);
make_proto_method(dahua, "get_record_mode", '/cgi-bin/configManager.cgi?action=getConfig&name=RecordMode', parse_output);
make_proto_method(dahua, "get_global_media_config", '/cgi-bin/configManager.cgi?action=getConfig&name=MediaGlobal', parse_output);

dahua.prototype.get_user_info = async function(username) {
  const path = `/cgi-bin/userManager.cgi?action=getUserInfo&name=${username}`;
  const self = this;
  return await make_sane_return(async function() {
    const httpsAgent = this.PROTOCOL === "https" ? new https.Agent({ rejectUnauthorized: false }) : undefined;
    const response = await self.digest_auth.request({
      method: "GET",
      url: self.BASEURI + `/cgi-bin/userManager.cgi?action=getUserInfo&name=${username}`,
      httpsAgent,
    });

    if (response.request.path !== path) {
      throw { response: { status: 404, statusText: "Path Not Found" } };
    }

    return parse_output(response.data);
  });
};

dahua.prototype.get_caps = async function(channel_index) {
  const path = `/cgi-bin/devVideoInput.cgi?action=getCaps&channel=${channel_index}`;
  const self = this;
  return await make_sane_return(async function() {
    const httpsAgent = this.PROTOCOL === "https" ? new https.Agent({ rejectUnauthorized: false }) : undefined;
    const response = await self.digest_auth.request({
      method: "GET",
      url: self.BASEURI + `/cgi-bin/devVideoInput.cgi?action=getCaps&channel=${channel_index}`,
      httpsAgent,
    });

    if (response.request.path !== path) {
      throw { response: { status: 404, statusText: "Path Not Found" } };
    }

    return parse_output(response.data);
  });
};

dahua.prototype.picture = async function(channel_id) {
  // Xử lý channel_id để lấy đúng định dạng kênh cho camera Dahua
  let channelNumber = "1";
  if (channel_id === "101" || channel_id === "1") {
    // Kênh 1, luồng chính
    channelNumber = "1";
  } else if (channel_id === "102") {
    // Kênh 1, luồng phụ
    channelNumber = "1"; 
  } else if (channel_id === "201") {
    // Kênh 2, luồng chính
    channelNumber = "2";
  } else if (channel_id === "202") {
    // Kênh 2, luồng phụ
    channelNumber = "2";
  } else {
    // Nếu không khớp, lấy ký tự đầu tiên như cũ
    channelNumber = (""+channel_id).trim().substring(0,1);
  }
  
  console.log(`Thử lấy snapshot cho kênh ${channelNumber}`);
  
  // Thử lần lượt các đường dẫn snapshot dựa theo tài liệu API của Dahua
  const paths = [
    `/cgi-bin/snapshot.cgi?channel=${channelNumber}`,
    `/snapshot.cgi?channel=${channelNumber}`,
    `/cgi-bin/snapshot.cgi`,
    `/snapshot.cgi`,
    `/cgi-bin/getSnapshot.cgi?channel=${channelNumber}`,
    `/getSnapshot.cgi?channel=${channelNumber}`,
    `/cgi-bin/image.cgi`,
    `/cgi-bin/images.cgi`,
    // Mẫu đường dẫn không tiêu chuẩn nhưng đôi khi hoạt động
    `/ISAPI/Streaming/channels/${channelNumber}/picture`,
    `/ISAPI/Streaming/channels/${channelNumber}01/picture`,  // Hikvision format
    `/onvif-http/snapshot?channel=${channelNumber}`
  ];
  
  let lastError = null;
  
  for (const path of paths) {
    try {
      const req_url = `${this.BASEURI}${path}`;
      console.log(`Thử lấy snapshot từ: ${req_url}`);
      
      const httpsAgent = this.PROTOCOL === "https" ? new https.Agent({ rejectUnauthorized: false }) : undefined;
      
      const response = await this.digest_auth.request({
        method: "GET",
        url: req_url,
        httpsAgent,
        responseType: 'arraybuffer',
        timeout: 8000  // Timeout ngắn hơn để nhanh chóng thử URL tiếp theo
      });
      
      // Kiểm tra lỗi có trong response
      if (typeof response.data === "string" && 
         (response.data.indexOf("The requested URL was not found on this server") !== -1 || 
          response.data.indexOf("404 File Not Found") !== -1 ||
          response.data.indexOf("Error") !== -1 ||
          response.data.indexOf("Bad Request") !== -1)) {
        console.log(`URL ${req_url} trả về lỗi: ${response.data}`);
        continue; // Thử URL tiếp theo
      }
      
      // Kiểm tra xem có dữ liệu ảnh không
      if (response.data && response.data.length > 100) { // Đảm bảo kích thước tối thiểu cho hình ảnh
        console.log(`Đã lấy ảnh thành công từ ${req_url}, kích thước: ${response.data.length} bytes`);
        return response.data;
      }
      
      console.log(`Không nhận được dữ liệu hình ảnh hoặc dữ liệu quá nhỏ từ ${req_url}`);
    } catch (error) {
      console.log(`Lỗi khi lấy snapshot từ ${path}: ${error.message || "Unknown error"}`);
      lastError = error;
      // Tiếp tục thử URL tiếp theo
    }
  }
  
  // Thử thêm một phương pháp khác nếu tất cả đều thất bại
  try {
    console.log("Sử dụng phương pháp xác thực khác cho snapshot...");
    const basicAuth = Buffer.from(`${this.USER}:${this.PASS}`).toString('base64');
    const req_url = `${this.BASEURI}/cgi-bin/snapshot.cgi?channel=${channelNumber}`;
    
    const httpsAgent = this.PROTOCOL === "https" ? new https.Agent({ rejectUnauthorized: false }) : undefined;
    const response = await axios.get(req_url, {
      headers: {
        'Authorization': `Basic ${basicAuth}`
      },
      httpsAgent,
      responseType: 'arraybuffer',
      timeout: 8000
    });
    
    if (response.data && response.data.length > 100) {
      console.log(`Đã lấy được ảnh với phương pháp Basic Auth, kích thước: ${response.data.length} bytes`);
      return response.data;
    }
  } catch (error) {
    console.log("Cả phương pháp Basic Auth cũng thất bại:", error.message);
    // Tiếp tục với lỗi trước đó
  }
  
  // Nếu không URL nào thành công, ném ra lỗi
  throw lastError || { message: "Không thể lấy snapshot từ bất kỳ URL nào" };
}
// имеет смысл сделать общие функции для dahua и для hikvision
dahua.prototype.device_info = async function() {
  const klass = await this.get_device_class();
  if (!klass.data) return klass;
  const type = await this.get_device_type();
  if (!type.data) return type;

  return { data: { type: klass.data, model: type.data }, status: { code: 200, desc: "Ok" } };
}

dahua.prototype.method = async function(url) {
  const req_url = `${this.BASEURI}${url}`;
  const httpsAgent = this.PROTOCOL === "https" ? new https.Agent({ rejectUnauthorized: false }) : undefined;
  const response = await this.digest_auth.request({
    method: "GET",
    url: req_url,
    httpsAgent,
    responseType: 'arraybuffer'
  });

  console.log(response);

  return response.data;
}

module.exports = dahua;