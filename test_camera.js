require("dotenv").config();
const dahua = require("./videoreg/apis/dahua");
const hikvision = require("./videoreg/apis/hikvision");
const fs = require("fs");

// Hãy thay đổi thông tin camera ở đây
const cameraInfo = {
  type: "hikvision", // hoặc "dahua"
  host: "camera-ip-address",
  port: 80,
  user: "admin",
  pass: "password"
};

async function testCamera() {
  try {
    console.log(`Đang thử kết nối với camera ${cameraInfo.type} at ${cameraInfo.host}...`);
    
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
      console.log(`Model: ${deviceInfo.data.model}`);
      console.log(`Type: ${deviceInfo.data.type}`);
      
      // Lấy hình ảnh từ camera
      console.log("Đang lấy hình ảnh từ camera...");
      const image = await camera.picture("101"); // "101" thường là kênh chính
      
      // Lưu hình ảnh ra file
      const filename = `camera_${cameraInfo.host.replace(/\./g, '_')}_snapshot.jpg`;
      fs.writeFileSync(filename, image);
      console.log(`Đã lưu hình ảnh thành ${filename}`);
    } else {
      console.error("Không thể kết nối đến camera:", deviceInfo.status);
    }
  } catch (error) {
    console.error("Lỗi khi kết nối đến camera:", error);
  }
}

testCamera();