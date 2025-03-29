#!/bin/bash

# Mã màu cho terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'
CYAN='\033[0;36m'

# Đường dẫn hiện tại
CURRENT_DIR=$(pwd)

# Hàm in thông báo thành công
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Hàm in thông báo thông tin
print_info() {
  echo -e "${CYAN}ℹ $1${NC}"
}

# Hàm in thông báo cảnh báo
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Hàm in thông báo lỗi
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Hàm in tiêu đề
print_title() {
  echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}"
}

# Hàm kiểm tra và cài đặt các phụ thuộc
check_and_install_dependencies() {
  print_title "Kiểm tra và cài đặt phụ thuộc hệ thống"
  
  # Kiểm tra hệ điều hành
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    print_info "Hệ điều hành: $OS"
  else
    OS="Unknown"
    print_warning "Không thể xác định hệ điều hành"
  fi
  
  # Kiểm tra và cài đặt các gói phụ thuộc trên Ubuntu/Debian
  if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    print_info "Cài đặt các gói phụ thuộc trên $OS..."
    
    # Cập nhật danh sách gói
    sudo apt-get update
    
    # Cài đặt Node.js và npm
    if ! command -v node &> /dev/null; then
      print_info "Cài đặt Node.js và npm..."
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y nodejs
      
      if command -v node &> /dev/null; then
        print_success "Node.js đã được cài đặt: $(node -v)"
      else
        print_error "Không thể cài đặt Node.js"
        exit 1
      fi
    else
      print_success "Node.js đã được cài đặt: $(node -v)"
    fi
    
    # Cài đặt FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
      print_info "Cài đặt FFmpeg..."
      sudo apt-get install -y ffmpeg
      
      if command -v ffmpeg &> /dev/null; then
        print_success "FFmpeg đã được cài đặt: $(ffmpeg -version | head -n1)"
      else
        print_error "Không thể cài đặt FFmpeg"
        exit 1
      fi
    else
      print_success "FFmpeg đã được cài đặt: $(ffmpeg -version | head -n1)"
    fi
    
    # Cài đặt các gói cần thiết khác
    print_info "Cài đặt các gói phụ thuộc khác..."
    sudo apt-get install -y \
      libuuid1 \
      uuid-runtime \
      libcairo2-dev \
      libpango1.0-dev \
      libjpeg-dev \
      libgif-dev \
      librsvg2-dev \
      curl \
      git \
      build-essential
    
    # Kiểm tra nếu Docker đã được cài đặt
    if ! command -v docker &> /dev/null; then
      print_info "Cài đặt Docker..."
      curl -fsSL https://get.docker.com | sudo sh
      sudo usermod -aG docker $USER
      
      if command -v docker &> /dev/null; then
        print_success "Docker đã được cài đặt"
      else
        print_warning "Không thể cài đặt Docker. Vui lòng cài đặt thủ công."
      fi
    else
      print_success "Docker đã được cài đặt"
    fi
    
    # Kiểm tra nếu Docker Compose đã được cài đặt
    if ! command -v docker-compose &> /dev/null; then
      print_info "Cài đặt Docker Compose..."
      sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
      sudo chmod +x /usr/local/bin/docker-compose
      
      if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose đã được cài đặt"
      else
        print_warning "Không thể cài đặt Docker Compose. Vui lòng cài đặt thủ công."
      fi
    else
      print_success "Docker Compose đã được cài đặt"
    fi
    
  # Kiểm tra và cài đặt các gói phụ thuộc trên CentOS/RHEL/Fedora
  elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    print_info "Cài đặt các gói phụ thuộc trên $OS..."
    
    # Cài đặt Node.js và npm
    if ! command -v node &> /dev/null; then
      print_info "Cài đặt Node.js và npm..."
      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
      sudo yum install -y nodejs
      
      if command -v node &> /dev/null; then
        print_success "Node.js đã được cài đặt: $(node -v)"
      else
        print_error "Không thể cài đặt Node.js"
        exit 1
      fi
    else
      print_success "Node.js đã được cài đặt: $(node -v)"
    fi
    
    # Cài đặt FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
      print_info "Cài đặt FFmpeg..."
      sudo yum install -y epel-release
      sudo yum install -y ffmpeg ffmpeg-devel
      
      if command -v ffmpeg &> /dev/null; then
        print_success "FFmpeg đã được cài đặt: $(ffmpeg -version | head -n1)"
      else
        print_error "Không thể cài đặt FFmpeg"
        exit 1
      fi
    else
      print_success "FFmpeg đã được cài đặt: $(ffmpeg -version | head -n1)"
    fi
    
    # Cài đặt các gói cần thiết khác
    print_info "Cài đặt các gói phụ thuộc khác..."
    sudo yum install -y \
      libuuid \
      uuid \
      cairo-devel \
      pango-devel \
      libjpeg-turbo-devel \
      giflib-devel \
      librsvg2-devel \
      curl \
      git \
      gcc-c++ \
      make
    
    # Kiểm tra nếu Docker đã được cài đặt
    if ! command -v docker &> /dev/null; then
      print_info "Cài đặt Docker..."
      curl -fsSL https://get.docker.com | sudo sh
      sudo usermod -aG docker $USER
      
      if command -v docker &> /dev/null; then
        print_success "Docker đã được cài đặt"
      else
        print_warning "Không thể cài đặt Docker. Vui lòng cài đặt thủ công."
      fi
    else
      print_success "Docker đã được cài đặt"
    fi
    
    # Kiểm tra nếu Docker Compose đã được cài đặt
    if ! command -v docker-compose &> /dev/null; then
      print_info "Cài đặt Docker Compose..."
      sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
      sudo chmod +x /usr/local/bin/docker-compose
      
      if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose đã được cài đặt"
      else
        print_warning "Không thể cài đặt Docker Compose. Vui lòng cài đặt thủ công."
      fi
    else
      print_success "Docker Compose đã được cài đặt"
    fi
    
  # Kiểm tra và cài đặt các gói phụ thuộc trên macOS
  elif [[ "$OS" == *"macOS"* ]] || [[ "$(uname)" == "Darwin" ]]; then
    print_info "Cài đặt các gói phụ thuộc trên macOS..."
    
    # Kiểm tra nếu Homebrew đã được cài đặt
    if ! command -v brew &> /dev/null; then
      print_info "Cài đặt Homebrew..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      
      if command -v brew &> /dev/null; then
        print_success "Homebrew đã được cài đặt"
      else
        print_error "Không thể cài đặt Homebrew"
        exit 1
      fi
    else
      print_success "Homebrew đã được cài đặt"
    fi
    
    # Cài đặt Node.js và npm
    if ! command -v node &> /dev/null; then
      print_info "Cài đặt Node.js và npm..."
      brew install node
      
      if command -v node &> /dev/null; then
        print_success "Node.js đã được cài đặt: $(node -v)"
      else
        print_error "Không thể cài đặt Node.js"
        exit 1
      fi
    else
      print_success "Node.js đã được cài đặt: $(node -v)"
    fi
    
    # Cài đặt FFmpeg
    if ! command -v ffmpeg &> /dev/null; then
      print_info "Cài đặt FFmpeg..."
      brew install ffmpeg
      
      if command -v ffmpeg &> /dev/null; then
        print_success "FFmpeg đã được cài đặt: $(ffmpeg -version | head -n1)"
      else
        print_error "Không thể cài đặt FFmpeg"
        exit 1
      fi
    else
      print_success "FFmpeg đã được cài đặt: $(ffmpeg -version | head -n1)"
    fi
    
    # Cài đặt các gói cần thiết khác
    print_info "Cài đặt các gói phụ thuộc khác..."
    brew install \
      cairo \
      pango \
      jpeg \
      giflib \
      librsvg \
      curl \
      git \
      pkg-config
    
    # Kiểm tra nếu Docker đã được cài đặt
    if ! command -v docker &> /dev/null; then
      print_info "Cài đặt Docker..."
      brew install --cask docker
      
      if command -v docker &> /dev/null; then
        print_success "Docker đã được cài đặt"
      else
        print_warning "Không thể cài đặt Docker. Vui lòng cài đặt thủ công từ https://docs.docker.com/desktop/mac/install/"
      fi
    else
      print_success "Docker đã được cài đặt"
    fi
    
  else
    print_warning "Hệ điều hành không được hỗ trợ cho cài đặt tự động. Vui lòng cài đặt thủ công các phụ thuộc sau: Node.js, npm, FFmpeg, và các thư viện phát triển."
  fi
}

# Hàm cài đặt các gói npm
install_node_packages() {
  print_title "Cài đặt các gói npm"
  
  # Cài đặt các gói npm
  print_info "Cài đặt các gói phụ thuộc npm..."
  npm install
  
  if [ $? -eq 0 ]; then
    print_success "Đã cài đặt các gói npm thành công"
  else
    print_error "Không thể cài đặt các gói npm"
    exit 1
  fi
}

# Hàm tạo các thư mục cần thiết
create_directories() {
  print_title "Tạo cấu trúc thư mục"
  
  # Danh sách các thư mục cần tạo
  directories=(
    "public/snapshots"
    "public/analytics"
    "logs"
    "config"
    "data/snapshots"
    "data/analytics"
  )
  
  # Tạo từng thư mục
  for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    print_success "Đã tạo thư mục: $dir"
  done
}

# Hàm thiết lập cấu hình
setup_configuration() {
  print_title "Thiết lập cấu hình"
  
  # Kiểm tra và tạo tệp .env
  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      cp .env.example .env
      print_success "Đã tạo tệp .env từ mẫu"
    else
      cat > .env << EOL
# Cấu hình máy chủ
PORT=5000
NODE_ENV=production

# Khóa bí mật cho phiên làm việc
SESSION_SECRET=$(openssl rand -hex 32)

# Cấu hình DeepStack AI (không bắt buộc)
DEEPSTACK_HOST=
DEEPSTACK_PORT=80
DEEPSTACK_API_KEY=

# Đường dẫn FFmpeg (để trống nếu sử dụng mặc định của hệ thống)
FFMPEG_PATH=$(which ffmpeg)

# Cấu hình lưu trữ
SNAPSHOT_DIR=./public/snapshots
ANALYTICS_DIR=./public/analytics
LOG_DIR=./logs

# Thời gian lưu giữ dữ liệu (ngày)
RETENTION_DAYS=30

# Cấu hình tích hợp VLC (tùy chọn)
ENABLE_VLC=true
VLC_HTTP_PORT=8081
EOL
      print_success "Đã tạo tệp .env mới"
    fi
  else
    print_info "Tệp .env đã tồn tại"
  fi
  
  # Kiểm tra và tạo tệp cấu hình config/default.json
  if [ ! -f "config/default.json" ]; then
    cat > config/default.json << EOL
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
  },
  "storage": {
    "snapshotDir": "./public/snapshots",
    "analyticsDir": "./public/analytics",
    "logDir": "./logs",
    "retentionDays": 30
  },
  "stream": {
    "portRange": {
      "start": 9000,
      "end": 9999
    },
    "ffmpegPath": "$(which ffmpeg)",
    "enableVLC": true
  }
}
EOL
    print_success "Đã tạo tệp cấu hình mặc định"
  else
    print_info "Tệp cấu hình đã tồn tại"
  fi
}

# Hàm xây dựng và chạy Docker
build_and_run_docker() {
  print_title "Xây dựng và chạy Docker"
  
  if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    print_info "Xây dựng và khởi động container..."
    
    # Kiểm tra xem tệp docker-compose.yml có tồn tại không
    if [ ! -f "docker-compose.yml" ]; then
      print_error "Không tìm thấy tệp docker-compose.yml"
      return 1
    fi
    
    # Dừng container đang chạy nếu có
    docker-compose down
    
    # Xây dựng và khởi động container
    docker-compose up -d --build
    
    if [ $? -eq 0 ]; then
      print_success "Đã khởi động ứng dụng trong Docker container"
      print_info "Ứng dụng đang chạy tại http://localhost:5000"
    else
      print_error "Không thể khởi động ứng dụng trong Docker container"
      return 1
    fi
  else
    print_warning "Docker hoặc Docker Compose không được cài đặt. Bỏ qua bước này."
    return 1
  fi
}

# Hàm chạy ứng dụng trực tiếp (không qua Docker)
run_application_directly() {
  print_title "Khởi động ứng dụng trực tiếp"
  
  # Kiểm tra xem tệp server.js có tồn tại không
  if [ ! -f "server.js" ]; then
    print_error "Không tìm thấy tệp server.js"
    return 1
  fi
  
  # Tạo systemd service nếu là Linux
  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    print_info "Tạo systemd service cho ứng dụng..."
    
    # Đường dẫn tệp service
    SERVICE_FILE="/etc/systemd/system/camera-monitor.service"
    
    # Tạo nội dung tệp service
    sudo tee $SERVICE_FILE > /dev/null << EOL
[Unit]
Description=Camera Monitoring Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR
ExecStart=$(which node) $CURRENT_DIR/server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOL
    
    # Reload systemd daemon
    sudo systemctl daemon-reload
    
    # Kích hoạt và khởi động service
    sudo systemctl enable camera-monitor
    sudo systemctl start camera-monitor
    
    if [ $? -eq 0 ]; then
      print_success "Đã tạo và khởi động systemd service"
      print_info "Kiểm tra trạng thái service: sudo systemctl status camera-monitor"
      print_info "Ứng dụng đang chạy tại http://localhost:5000"
    else
      print_error "Không thể khởi động systemd service"
      print_info "Thử khởi động thủ công: node server.js"
    fi
  else
    print_info "Khởi động ứng dụng trong nền..."
    nohup node server.js > $CURRENT_DIR/logs/app.log 2>&1 &
    
    if [ $? -eq 0 ]; then
      echo $! > $CURRENT_DIR/app.pid
      print_success "Đã khởi động ứng dụng trong nền với PID: $(cat $CURRENT_DIR/app.pid)"
      print_info "Ứng dụng đang chạy tại http://localhost:5000"
      print_info "Xem nhật ký: tail -f $CURRENT_DIR/logs/app.log"
    else
      print_error "Không thể khởi động ứng dụng"
    fi
  fi
}

# Hàm chính
main() {
  echo -e "${BOLD}${CYAN}=== Camera Monitoring Platform - Cài đặt tự động ===${NC}"
  
  # Các bước cài đặt
  check_and_install_dependencies
  create_directories
  install_node_packages
  setup_configuration
  
  # Tải mô hình AI
  print_title "Tải mô hình AI"
  print_info "Tải và cài đặt mô hình AI YOLO..."
  node update_ai_model.js
  
  # Ưu tiên chạy Docker, nếu không được thì chạy trực tiếp
  if ! build_and_run_docker; then
    run_application_directly
  fi
  
  echo -e "\n${BOLD}${GREEN}=== Quá trình cài đặt đã hoàn tất ===${NC}"
  echo -e "${CYAN}Truy cập vào ứng dụng tại:${NC} ${BOLD}http://localhost:5000${NC}"
}

# Chạy hàm chính
main