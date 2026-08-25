#!/bin/bash
# ============================================================
# Script triển khai ứng dụng lên Cloud VM
# Chạy script này trên máy ảo cloud sau khi SSH vào
# ============================================================
# Cách dùng:
#   1. SSH vào VM: ssh -i key.pem user@<VM_IP>
#   2. Upload script: scp deploy.sh user@<VM_IP>:~/
#   3. Chạy: chmod +x deploy.sh && ./deploy.sh
# ============================================================

set -e

echo "=========================================="
echo "🚀 Triển khai Journal Trend Tracker"
echo "=========================================="

# ---- Bước 1: Cập nhật hệ thống ----
echo ""
echo "📦 Bước 1: Cập nhật hệ thống..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ---- Bước 2: Cài Docker ----
echo ""
echo "🐳 Bước 2: Cài đặt Docker..."
if ! command -v docker &> /dev/null; then
    # Cài Docker theo hướng dẫn chính thức
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    # Thêm user hiện tại vào group docker (không cần sudo)
    sudo usermod -aG docker $USER
    echo "✅ Docker đã được cài đặt!"
    echo "⚠️  Cần logout/login lại để dùng docker không cần sudo"
else
    echo "✅ Docker đã có sẵn: $(docker --version)"
fi

# ---- Bước 3: Clone repository ----
echo ""
echo "📂 Bước 3: Clone repository..."
REPO_DIR="$HOME/journal-trend-tracker"
REPO_URL="https://github.com/YOUR_GITHUB_USERNAME/Scientific-Journal-Publication-Trend-Tracking-System.git"

if [ -d "$REPO_DIR" ]; then
    echo "📂 Repository đã tồn tại, pulling latest..."
    cd "$REPO_DIR"
    git pull origin main
else
    echo "📂 Cloning repository..."
    git clone "$REPO_URL" "$REPO_DIR"
    cd "$REPO_DIR"
fi

# ---- Bước 4: Tạo file .env ----
echo ""
echo "⚙️  Bước 4: Cấu hình environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Đã tạo file .env từ .env.example"
    echo "⚠️  Hãy chỉnh sửa .env với giá trị thật trước khi tiếp tục:"
    echo "    nano .env"
else
    echo "✅ File .env đã tồn tại"
fi

# ---- Bước 5: Build & Run ----
echo ""
echo "🔨 Bước 5: Build và chạy containers..."
sudo docker compose down 2>/dev/null || true
sudo docker compose up -d --build

# ---- Bước 6: Kiểm tra ----
echo ""
echo "🔍 Bước 6: Kiểm tra containers..."
sleep 10
sudo docker compose ps

echo ""
echo "=========================================="
echo "✅ Triển khai hoàn tất!"
echo "=========================================="
echo ""
echo "📌 Truy cập ứng dụng:"
echo "   🌐 Frontend: http://$(curl -s ifconfig.me)"
echo "   📡 Backend API: http://$(curl -s ifconfig.me):8080"
echo "   📖 Swagger UI: http://$(curl -s ifconfig.me):8080/swagger-ui.html"
echo ""
echo "📌 Lệnh hữu ích:"
echo "   Xem logs:     sudo docker compose logs -f"
echo "   Dừng app:     sudo docker compose down"
echo "   Restart:      sudo docker compose restart"
echo "   Rebuild:      sudo docker compose up -d --build"
echo ""
