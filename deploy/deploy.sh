#!/bin/bash

# StoryBookMaker 统一部署脚本
# 包含所有依赖安装、环境配置和问题修复

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "StoryBookMaker 统一部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --full          完整部署（包含所有依赖安装）"
    echo "  --quick         快速部署（仅构建和启动）"
    echo "  --fix-chrome    修复Chrome和PDF问题"
    echo "  --fix-fonts     修复中文字体问题"
    echo "  --fix-nginx     修复Nginx配置问题"
    echo "  --check         检查系统环境"
    echo "  --help          显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --full       # 完整部署"
    echo "  $0 --quick      # 快速部署"
    echo "  $0 --fix-fonts  # 仅修复字体问题"
}

# 检查系统环境
check_system() {
    print_header "检查系统环境"
    
    # 检查操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        print_info "操作系统: $PRETTY_NAME"
    else
        print_warning "无法检测操作系统"
    fi
    
    # 检查内存
    MEMORY=$(free -h | grep Mem | awk '{print $2}')
    print_info "内存: $MEMORY"
    
    # 检查磁盘空间
    DISK=$(df -h / | tail -1 | awk '{print $4}')
    print_info "可用磁盘空间: $DISK"
    
    # 检查网络连接
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        print_status "网络连接正常"
    else
        print_warning "网络连接异常"
    fi
    
    # 检查权限
    if [ "$EUID" -eq 0 ]; then
        print_status "以root权限运行"
    else
        print_warning "建议使用sudo运行以获得完整功能"
    fi
}

# 安装系统依赖
install_system_deps() {
    print_header "安装系统依赖"
    
    if command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL/Amazon Linux
        print_info "检测到CentOS/RHEL系统"
        yum update -y
        yum install -y wget curl unzip fontconfig dejavu-fonts-common
        
    elif command -v apt-get >/dev/null 2>&1; then
        # Ubuntu/Debian
        print_info "检测到Ubuntu/Debian系统"
        export DEBIAN_FRONTEND=noninteractive
        apt-get update -y
        apt-get install -y wget curl unzip fontconfig fonts-dejavu-core
    else
        print_error "不支持的操作系统"
        exit 1
    fi
    
    print_status "系统依赖安装完成"
}

# 安装Node.js
install_nodejs() {
    print_header "安装Node.js"
    
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_info "Node.js已安装: $NODE_VERSION"
        
        # 检查版本是否满足要求
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -ge 18 ]; then
            print_status "Node.js版本满足要求"
            return
        else
            print_warning "Node.js版本过低，需要升级"
        fi
    fi
    
    print_info "安装Node.js 18..."
    
    if command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    elif command -v apt-get >/dev/null 2>&1; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # 验证安装
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        print_status "Node.js安装成功: $NODE_VERSION"
    else
        print_error "Node.js安装失败"
        exit 1
    fi
}

# 安装Chrome浏览器
install_chrome() {
    print_header "安装Chrome浏览器"
    
    # 检查是否已安装
    if command -v google-chrome >/dev/null 2>&1; then
        CHROME_VERSION=$(google-chrome --version)
        print_status "Chrome已安装: $CHROME_VERSION"
        return
    fi
    
    print_info "安装Google Chrome..."
    cd /tmp
    
    if command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL
        wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
        yum localinstall -y google-chrome-stable_current_x86_64.rpm || rpm -i google-chrome-stable_current_x86_64.rpm --nodeps
        rm -f google-chrome-stable_current_x86_64.rpm
        
    elif command -v apt-get >/dev/null 2>&1; then
        # Ubuntu/Debian
        wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
        dpkg -i google-chrome-stable_current_amd64.deb || apt-get install -f -y
        rm -f google-chrome-stable_current_amd64.deb
    fi
    
    # 创建符号链接
    ln -sf /usr/bin/google-chrome /usr/bin/chromium-browser 2>/dev/null || true
    ln -sf /usr/bin/google-chrome /usr/bin/chromium 2>/dev/null || true
    chmod +x /usr/bin/google-chrome
    
    # 验证安装
    if command -v google-chrome >/dev/null 2>&1; then
        CHROME_VERSION=$(google-chrome --version)
        print_status "Chrome安装成功: $CHROME_VERSION"
    else
        print_error "Chrome安装失败"
        exit 1
    fi
}

# 安装中文字体
install_chinese_fonts() {
    print_header "安装中文字体"
    
    # 检查是否已有中文字体
    CHINESE_FONTS=$(fc-list :lang=zh-cn 2>/dev/null | wc -l)
    if [ "$CHINESE_FONTS" -gt 0 ]; then
        print_status "中文字体已安装 ($CHINESE_FONTS 个)"
        return
    fi
    
    print_info "安装中文字体..."
    
    # 创建字体目录
    mkdir -p /usr/share/fonts/chinese
    cd /tmp
    
    # 安装系统字体包
    if command -v yum >/dev/null 2>&1; then
        yum install -y wqy-microhei-fonts google-noto-cjk-fonts 2>/dev/null || true
    elif command -v apt-get >/dev/null 2>&1; then
        apt-get install -y fonts-wqy-microhei fonts-noto-cjk 2>/dev/null || true
    fi
    
    # 下载文泉驿微米黑字体
    print_info "下载文泉驿微米黑字体..."
    WQYFONTS_URLS=(
        "https://downloads.sourceforge.net/wqy/wqy-microhei-0.2.0-beta.tar.gz"
        "https://nchc.dl.sourceforge.net/project/wqy/wqy-microhei/0.2.0-beta/wqy-microhei-0.2.0-beta.tar.gz"
    )
    
    for url in "${WQYFONTS_URLS[@]}"; do
        if wget -O wqy-microhei.tar.gz "$url" --timeout=60 --tries=2; then
            if tar -xzf wqy-microhei.tar.gz; then
                find . -name "*.ttc" -o -name "*.ttf" -exec cp {} /usr/share/fonts/chinese/ \;
                print_status "文泉驿字体安装成功"
                break
            fi
        fi
        rm -f wqy-microhei.tar.gz
        rm -rf wqy-microhei-*
    done
    
    # 下载思源黑体
    print_info "下载思源黑体..."
    if wget -O NotoSansCJK-Regular.ttc "https://github.com/googlefonts/noto-cjk/releases/download/Sans2.004/NotoSansCJK-Regular.ttc" --timeout=120 --tries=2; then
        cp NotoSansCJK-Regular.ttc /usr/share/fonts/chinese/
        print_status "思源黑体安装成功"
        rm -f NotoSansCJK-Regular.ttc
    fi
    
    # 设置权限
    chmod -R 644 /usr/share/fonts/chinese/* 2>/dev/null || true
    find /usr/share/fonts/chinese -type d -exec chmod 755 {} \; 2>/dev/null || true
    
    # 创建字体配置
    cat > /etc/fonts/local.conf << 'EOF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>Noto Sans CJK SC</family>
      <family>WenQuanYi Micro Hei</family>
      <family>DejaVu Sans</family>
    </prefer>
  </alias>
  <match target="pattern">
    <test name="lang" compare="contains">
      <string>zh</string>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>WenQuanYi Micro Hei</string>
      <string>Noto Sans CJK SC</string>
    </edit>
  </match>
</fontconfig>
EOF
    
    # 更新字体缓存
    fc-cache -f -v
    
    # 验证安装
    CHINESE_FONTS=$(fc-list :lang=zh-cn 2>/dev/null | wc -l)
    if [ "$CHINESE_FONTS" -gt 0 ]; then
        print_status "中文字体安装成功 ($CHINESE_FONTS 个)"
    else
        print_warning "中文字体安装可能不完整"
    fi
}

# 配置Nginx
configure_nginx() {
    print_header "配置Nginx"
    
    if ! command -v nginx >/dev/null 2>&1; then
        print_info "安装Nginx..."
        if command -v yum >/dev/null 2>&1; then
            yum install -y nginx
        elif command -v apt-get >/dev/null 2>&1; then
            apt-get install -y nginx
        fi
    fi
    
    # 检查项目目录
    PROJECT_DIR=$(pwd)
    if [[ ! "$PROJECT_DIR" =~ StoryBookMaker ]]; then
        PROJECT_DIR=$(find /root /home -name "StoryBookMaker" -type d 2>/dev/null | head -1)
    fi
    
    if [ -z "$PROJECT_DIR" ]; then
        print_warning "未找到项目目录，跳过Nginx配置"
        return
    fi
    
    print_info "配置Nginx反向代理..."
    
    # 创建Nginx配置
    cat > /etc/nginx/sites-available/storybook-maker << EOF
server {
    listen 80;
    server_name _;
    
    # 静态文件
    location /_next/static/ {
        alias $PROJECT_DIR/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 反向代理到Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF
    
    # 启用站点
    if [ -d "/etc/nginx/sites-enabled" ]; then
        ln -sf /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
    fi
    
    # 测试配置
    if nginx -t; then
        print_status "Nginx配置成功"
        systemctl enable nginx
        systemctl restart nginx
    else
        print_warning "Nginx配置测试失败"
    fi
}

# 安装项目依赖
install_project_deps() {
    print_header "安装项目依赖"
    
    # 确保在项目目录中
    if [ ! -f "package.json" ]; then
        print_error "未找到package.json文件，请在项目根目录运行此脚本"
        exit 1
    fi
    
    print_info "配置npm镜像源..."
    npm config set registry https://registry.npmmirror.com
    npm config set legacy-peer-deps true
    
    print_info "安装项目依赖..."
    if npm install --legacy-peer-deps; then
        print_status "项目依赖安装成功"
    else
        print_error "项目依赖安装失败"
        exit 1
    fi
}

# 构建项目
build_project() {
    print_header "构建项目"
    
    print_info "构建Next.js项目..."
    if npm run build; then
        print_status "项目构建成功"
    else
        print_error "项目构建失败"
        exit 1
    fi
}

# 配置环境变量
setup_env() {
    print_header "配置环境变量"
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.demo" ]; then
            cp .env.demo .env.local
            print_info "已创建.env.local文件，请配置你的API密钥"
            print_warning "请编辑.env.local文件，设置ARK_API_KEY"
        else
            print_warning "未找到环境变量模板文件"
        fi
    else
        print_status "环境变量文件已存在"
    fi
}

# 启动应用
start_application() {
    print_header "启动应用"
    
    # 检查是否已在运行
    if [ -f "app.pid" ] && kill -0 $(cat app.pid) 2>/dev/null; then
        print_warning "应用已在运行"
        return
    fi
    
    # 检查端口占用
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_warning "端口3000被占用，尝试清理..."
        fuser -k 3000/tcp 2>/dev/null || true
        sleep 2
    fi
    
    print_info "启动应用..."
    nohup npm start > app.log 2>&1 &
    APP_PID=$!
    echo $APP_PID > app.pid
    
    # 等待启动
    sleep 5
    
    if kill -0 $APP_PID 2>/dev/null && netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "应用启动成功 (PID: $APP_PID)"
        
        # 获取外网IP
        EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo "")
        if [ -n "$EXTERNAL_IP" ]; then
            print_info "访问地址: http://$EXTERNAL_IP"
        fi
        print_info "本地访问: http://localhost:3000"
    else
        print_error "应用启动失败"
        if [ -f "app.log" ]; then
            echo "错误日志："
            tail -20 app.log
        fi
        exit 1
    fi
}

# 测试系统功能
test_system() {
    print_header "测试系统功能"
    
    # 测试Chrome
    print_info "测试Chrome浏览器..."
    if google-chrome --version >/dev/null 2>&1; then
        print_status "Chrome测试通过"
    else
        print_warning "Chrome测试失败"
    fi
    
    # 测试中文字体
    print_info "测试中文字体..."
    CHINESE_FONTS=$(fc-list :lang=zh-cn 2>/dev/null | wc -l)
    if [ "$CHINESE_FONTS" -gt 0 ]; then
        print_status "中文字体测试通过 ($CHINESE_FONTS 个)"
    else
        print_warning "中文字体测试失败"
    fi
    
    # 测试应用响应
    print_info "测试应用响应..."
    if curl -s --connect-timeout 5 http://localhost:3000 >/dev/null 2>&1; then
        print_status "应用响应测试通过"
    else
        print_warning "应用响应测试失败"
    fi
}

# 显示部署结果
show_result() {
    print_header "部署完成"
    
    echo ""
    print_status "🎉 StoryBookMaker 部署成功！"
    echo ""
    echo "📋 部署摘要:"
    echo "   ✅ 系统依赖已安装"
    echo "   ✅ Node.js已安装"
    echo "   ✅ Chrome浏览器已安装"
    echo "   ✅ 中文字体已安装"
    echo "   ✅ 项目依赖已安装"
    echo "   ✅ 项目已构建"
    echo "   ✅ 应用已启动"
    echo ""
    echo "🌐 访问信息:"
    EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo "")
    if [ -n "$EXTERNAL_IP" ]; then
        echo "   外网访问: http://$EXTERNAL_IP"
    fi
    echo "   本地访问: http://localhost:3000"
    echo ""
    echo "📋 管理命令:"
    echo "   启动应用: ./deploy/start.sh"
    echo "   停止应用: ./deploy/stop.sh"
    echo "   重启应用: ./deploy/restart.sh"
    echo "   查看状态: ./deploy/status.sh"
    echo "   查看日志: tail -f app.log"
    echo ""
    echo "⚠️  重要提醒:"
    echo "   请编辑 .env.local 文件，配置你的豆包API密钥"
    echo "   然后重启应用: ./deploy/restart.sh"
}

# 主函数
main() {
    # 解析命令行参数
    case "${1:-}" in
        --help)
            show_help
            exit 0
            ;;
        --check)
            check_system
            exit 0
            ;;
        --fix-chrome)
            install_chrome
            exit 0
            ;;
        --fix-fonts)
            install_chinese_fonts
            exit 0
            ;;
        --fix-nginx)
            configure_nginx
            exit 0
            ;;
        --quick)
            print_header "StoryBookMaker 快速部署"
            setup_env
            install_project_deps
            build_project
            start_application
            show_result
            ;;
        --full|"")
            print_header "StoryBookMaker 完整部署"
            check_system
            install_system_deps
            install_nodejs
            install_chrome
            install_chinese_fonts
            configure_nginx
            setup_env
            install_project_deps
            build_project
            start_application
            test_system
            show_result
            ;;
        *)
            echo "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"