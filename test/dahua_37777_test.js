
const net = require('net');

// Thông tin kết nối
const host = 'huannv112.ddns.net';
const port = 37777;
const username = 'admin';
const password = 'Admin123';

// Tạo request đầu tiên (dựa theo file mã khai thác)
const initialPacket = Buffer.from([
  0xa1, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
]);

const client = new net.Socket();

client.connect(port, host, () => {
  console.log(`Đã kết nối đến ${host}:${port}`);
  client.write(initialPacket);
});

client.on('data', (data) => {
  console.log('Nhận được dữ liệu:');
  console.log(data);
  console.log(`Dạng hex: ${data.toString('hex')}`);
  
  // Kiểm tra phản hồi
  if (data.length >= 8 && data.toString('hex', 0, 8) === 'b1000058') {
    console.log('Kết nối thành công! Camera Dahua có thể truy cập qua cổng 37777.');
  }
  
  client.destroy();
});

client.on('close', () => {
  console.log('Kết nối đã đóng');
});

client.on('error', (err) => {
  console.error('Lỗi kết nối:', err.message);
});
    