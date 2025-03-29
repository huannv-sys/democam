# Camera Monitoring Platform

Một nền tảng giám sát camera mạnh mẽ được thiết kế để chẩn đoán và quản lý các tích hợp camera mạng phức tạp với tính năng phát hiện lỗi nâng cao và phân tích kết nối.

## Tính năng chính

- Backend Node.js với khả năng chẩn đoán mạng toàn diện
- Hỗ trợ kết nối camera đa giao thức (ONVIF/RTSP)
- Xử lý lỗi nâng cao và khắc phục sự cố mạng
- Giám sát trạng thái kết nối thời gian thực
- Hỗ trợ đa ngôn ngữ cho thông báo lỗi
- Phân tích video AI tích hợp (YOLO)
- Khả năng chuyển đổi dự phòng thông qua tích hợp VLC

## Yêu cầu hệ thống

- Node.js 18+ / 20+
- FFmpeg
- VLC (tùy chọn, cho chế độ dự phòng)
- Hỗ trợ Docker (tùy chọn)

## Cài đặt

### Sử dụng Docker (Khuyến nghị)

1. Sao chép mã nguồn:
```bash
git clone https://github.com/username/camera-monitoring-platform.git
cd camera-monitoring-platform
```

2. Cấu hình biến môi trường:
```bash
cp .env.example .env
# Chỉnh sửa tệp .env để thiết lập các biến môi trường cần thiết
```

3. Khởi động với Docker Compose:
```bash
docker-compose up -d
```

### Cài đặt thủ công

1. Sao chép mã nguồn:
```bash
git clone https://github.com/username/camera-monitoring-platform.git
cd camera-monitoring-platform
```

2. Cài đặt phụ thuộc:
```bash
npm install
```

3. Cấu hình:
```bash
cp .env.example .env
# Chỉnh sửa tệp .env để thiết lập các biến môi trường cần thiết
```

4. Khởi động ứng dụng:
```bash
node server.js
```

## Cấu hình

### Tệp cấu hình

Cấu hình được đặt trong thư mục `config`. Tệp mặc định là `config/default.json`.

```json
{
  "server": {
    "port": 5000,
    "host": "0.0.0.0"
  },
  "camera": {
    "connectTimeout": 8000,
    "retryAttempts": 3,
    "snapshotRefreshRate": 30000
  },
  "analytics": {
    "enabled": true,
    "scheduleInterval": "*/5 * * * *", 
    "defaultOptions": {
      "detectPersons": true,
      "detectFaces": false,
      "detectLicensePlates": false,
      "detectObjects": true
    }
  }
}
```

### Biến môi trường

- `PORT`: Cổng máy chủ (mặc định: 5000)
- `SESSION_SECRET`: Khóa bí mật cho phiên
- `DEEPSTACK_HOST`: Máy chủ DeepStack AI (tùy chọn)
- `DEEPSTACK_PORT`: Cổng DeepStack AI (tùy chọn)
- `DEEPSTACK_API_KEY`: Khóa API DeepStack AI (tùy chọn)

## Sử dụng

Sau khi khởi động, truy cập giao diện web tại:

```
http://localhost:5000
```

### Trang quản lý camera:

```
http://localhost:5000/dashboard
```

### Trang phân tích AI:

```
http://localhost:5000/analytics
```

## Tích hợp camera

Nền tảng này tương thích với nhiều loại camera IP, đặc biệt là Dahua và Hikvision thông qua các giao thức ONVIF/RTSP tiêu chuẩn.

### Thêm camera

1. Truy cập trang quản lý camera
2. Nhấp vào nút "Thêm camera mới"
3. Nhập thông tin camera (IP/DDNS, cổng, tên người dùng, mật khẩu)
4. Chọn loại camera (Dahua, Hikvision, hoặc ONVIF chung)
5. Kiểm tra kết nối và lưu

## Phân tích AI

Hệ thống sử dụng mô hình YOLO để thực hiện các tác vụ phân tích video như:

- Phát hiện người/đối tượng
- Nhận diện khuôn mặt
- Nhận diện biển số xe (ANPR)
- Đếm người
- Phân tích hành vi

## Xử lý sự cố

### Kết nối camera

Nếu gặp vấn đề kết nối với camera:

1. Kiểm tra cài đặt mạng và phần mềm camera
2. Thử các URL RTSP khác nhau (có thể xem trong mục cấu hình camera)
3. Kiểm tra tường lửa và quy tắc NAT
4. Sử dụng chế độ dự phòng VLC nếu các phương pháp khác không hoạt động

### Phân tích AI

Nếu phân tích AI không hoạt động:

1. Kiểm tra cấu hình YOLO
2. Đảm bảo thư viện OpenCV được cài đặt đúng cách
3. Kiểm tra logs để biết thêm thông tin

## Giấy phép

MIT

## Liên hệ

Nếu gặp vấn đề hoặc có câu hỏi, vui lòng tạo issue trên trang GitHub của dự án.