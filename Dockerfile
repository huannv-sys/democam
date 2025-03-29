FROM node:20-slim

# Cài đặt các gói hệ thống cần thiết
RUN apt-get update && apt-get install -y \
    ffmpeg \
    uuid-runtime \
    libuuid1 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép package.json trước để tận dụng bộ nhớ đệm của Docker
COPY package*.json ./

# Cài đặt các gói phụ thuộc
RUN npm install

# Sao chép mã nguồn
COPY . .

# Tạo thư mục lưu trữ dữ liệu
RUN mkdir -p public/snapshots public/analytics logs

# Đặt môi trường
ENV NODE_ENV=production
ENV PORT=5000

# Mở cổng
EXPOSE 5000 9000-9999

# Khởi động ứng dụng
CMD ["node", "server.js"]