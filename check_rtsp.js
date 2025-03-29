require("dotenv").config();
const dahua = require("./videoreg/apis/dahua");
const hikvision = require("./videoreg/apis/hikvision");
const fs = require("fs");

// Thay đổi thông tin camera ở đây
const cameraInfo = {
  type: "dahua", // hoặc "hikvision"
  host: "your_ddns_or_ip_address",
  port: 80,
  user: "admin",
  pass: "password"
};

// Các channel IDs và URIs RTSP phổ biến để thử nghiệm
const channelsToTest = {
  hikvision: [
    { id: "1", desc: "Channel 1 main stream" },
    { id: "101", desc: "Channel 1 main stream (alt)" },
    { id: "102", desc: "Channel 1 sub stream" },
    { id: "201", desc: "Channel 2 main stream" },
    { id: "202", desc: "Channel 2 sub stream" }
  ],
  dahua: [
    { id: "1", desc: "Channel 1" },
    { id: "101", desc: "Channel 1 (alt)" }
  ],
  rtspUrls: {
    hikvision: (host, user, pass) => [
      `rtsp://${user}:${pass}@${host}:554/ISAPI/Streaming/channels/101`,
      `rtsp://${user}:${pass}@${host}:554/ISAPI/Streaming/channels/102`,
      `rtsp://${user}:${pass}@${host}:554/h264/ch1/main/av_stream`,
      `rtsp://${user}:${pass}@${host}:554/h264/ch1/sub/av_stream`,
      `rtsp://${user}:${pass}@${host}:554/Streaming/Channels/1`,
      `rtsp://${user}:${pass}@${host}:554/Streaming/Channels/2`
    ],
    dahua: (host, user, pass) => [
      `rtsp://${user}:${pass}@${host}:554/cam/realmonitor?channel=1&subtype=0`,
      `rtsp://${user}:${pass}@${host}:554/cam/realmonitor?channel=1&subtype=1`,
      `rtsp://${user}:${pass}@${host}:554/cam/realmonitor?channel=2&subtype=0`,
      `rtsp://${user}:${pass}@${host}:554/stream1`,
      `rtsp://${user}:${pass}@${host}:554/stream2`
    ]
  }
};

async function testCamera() {
  try {
    console.log(`Đang kiểm tra camera ${cameraInfo.type} tại ${cameraInfo.host}...`);
    
    let camera;
    if (cameraInfo.type === "hikvision") {
      camera = new hikvision({
        host: cameraInfo.host,
        port: cameraInfo.port,
        user: cameraInfo.user,
        pass: cameraInfo.pass
      });
    } else if (cameraInfo.type === "dahua") {
      camera = new dahua({
        host: cameraInfo.host,
        port: cameraInfo.port,
        user: cameraInfo.user,
        pass: cameraInfo.pass
      });
    } else {
      throw new Error("Loại camera không được hỗ trợ. Hãy chọn 'hikvision' hoặc 'dahua'");
    }

    // Lấy thông tin thiết bị
    const deviceInfo = await camera.device_info();
    console.log("Thông tin thiết bị:", deviceInfo);

    if (deviceInfo.status.code === 200) {
      console.log("Kết nối thành công!");
      
      // Thử lấy ảnh từ tất cả các kênh có thể
      const channelsToTry = channelsToTest[cameraInfo.type];
      for (const channel of channelsToTry) {
        try {
          console.log(`\nĐang thử lấy ảnh từ ${channel.desc} (ID: ${channel.id})...`);
          const image = await camera.picture(channel.id);
          
          if (!image || (image instanceof Buffer && image.length === 0)) {
            console.log(`  - Không nhận được dữ liệu ảnh cho ${channel.desc}`);
            continue;
          }
          
          // Lưu hình ảnh ra file
          const filename = `camera_${cameraInfo.host.replace(/\./g, '_')}_channel_${channel.id}.jpg`;
          fs.writeFileSync(filename, image);
          console.log(`  - Đã lưu hình ảnh thành ${filename}`);
        } catch (error) {
          console.error(`  - Lỗi khi lấy ảnh từ ${channel.desc}:`, error.message);
        }
      }
      
      // In ra các URL RTSP có thể sử dụng
      console.log("\n=== URLs RTSP có thể dùng để xem video stream ===");
      const rtspUrls = channelsToTest.rtspUrls[cameraInfo.type](
        cameraInfo.host, 
        cameraInfo.user, 
        cameraInfo.pass
      );
      
      rtspUrls.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
      
    } else {
      console.error("Không thể kết nối đến camera:", deviceInfo.status);
    }
  } catch (error) {
    console.error("Lỗi khi kết nối đến camera:", error);
  }
}

testCamera();