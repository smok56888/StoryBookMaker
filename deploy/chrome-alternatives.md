# Chrome安装网络问题规避方案

## 问题说明
在中国大陆的ECS上，直接从Google下载Chrome会遇到网络连接问题。

## 解决方案

### 方案1: 使用国内Chrome镜像源 (推荐)

#### 1.1 使用清华大学镜像
```bash
# 添加清华大学Chrome镜像源
sudo wget -q -O - https://mirrors.tuna.tsinghua.edu.cn/google-chrome/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] https://mirrors.tuna.tsinghua.edu.cn/google-chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'

# 更新并安装
sudo apt update
sudo apt install -y google-chrome-stable
```

#### 1.2 使用中科大镜像
```bash
# 添加中科大Chrome镜像源
sudo wget -q -O - https://mirrors.ustc.edu.cn/google-chrome/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] https://mirrors.ustc.edu.cn/google-chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'

# 更新并安装
sudo apt update
sudo apt install -y google-chrome-stable
```

### 方案2: 手动下载Chrome deb包

#### 2.1 从国内镜像下载
```bash
# 创建临时目录
mkdir -p ~/chrome-install
cd ~/chrome-install

# 从清华镜像下载Chrome deb包
wget https://mirrors.tuna.tsinghua.edu.cn/google-chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_current_amd64.deb

# 安装依赖
sudo apt update
sudo apt install -y wget gnupg ca-certificates

# 安装Chrome
sudo dpkg -i google-chrome-stable_current_amd64.deb

# 修复可能的依赖问题
sudo apt-get install -f

# 清理
cd ~
rm -rf ~/chrome-install
```

#### 2.2 验证安装
```bash
# 检查Chrome版本
google-chrome-stable --version

# 检查Chrome路径
which google-chrome-stable
```

### 方案3: 使用Chromium替代Chrome

Chromium是Chrome的开源版本，在国内更容易安装：

```bash
# 直接从Ubuntu仓库安装Chromium
sudo apt update
sudo apt install -y chromium-browser

# 验证安装
chromium-browser --version
```

### 方案4: 完全跳过浏览器安装

如果PDF功能不是必需的，可以完全跳过：

```bash
# 设置环境变量
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true

# 在.env.local中禁用PDF功能
echo "DISABLE_PDF_GENERATION=true" >> .env.local
```

### 方案5: 使用轻量级替代方案

#### 5.1 使用wkhtmltopdf
```bash
# 安装wkhtmltopdf (更轻量的PDF生成工具)
sudo apt update
sudo apt install -y wkhtmltopdf

# 验证安装
wkhtmltopdf --version
```

#### 5.2 修改项目配置使用wkhtmltopdf
在.env.local中添加：
```bash
PDF_GENERATOR=wkhtmltopdf
WKHTMLTOPDF_PATH=/usr/bin/wkhtmltopdf
```

## 推荐的完整安装脚本

创建一个自动化安装脚本：

```bash
#!/bin/bash
# chrome-install.sh

set -e

echo "🔧 开始安装Chrome浏览器..."

# 检查网络连接
if ping -c 1 google.com &> /dev/null; then
    echo "✓ 网络连接正常，使用官方源"
    # 使用官方源
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
    sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
else
    echo "⚠ 网络受限，使用国内镜像源"
    # 使用清华镜像
    sudo wget -q -O - https://mirrors.tuna.tsinghua.edu.cn/google-chrome/linux_signing_key.pub | sudo apt-key add -
    sudo sh -c 'echo "deb [arch=amd64] https://mirrors.tuna.tsinghua.edu.cn/google-chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'
fi

# 更新包列表
sudo apt update

# 安装Chrome
if sudo apt install -y google-chrome-stable; then
    echo "✓ Chrome安装成功"
    google-chrome-stable --version
else
    echo "⚠ Chrome安装失败，尝试安装Chromium"
    sudo apt install -y chromium-browser
    echo "✓ Chromium安装成功"
    chromium-browser --version
fi

echo "🎉 浏览器安装完成！"
```

## 项目配置更新

### 更新环境变量检测
在.env.local中添加：
```bash
# 浏览器配置
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
# 如果使用Chromium，改为：
# PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 如果完全跳过PDF功能
# DISABLE_PDF_GENERATION=true
```

### 代码中的浏览器检测
可以在代码中添加自动检测：
```javascript
// 自动检测可用的浏览器
const findChrome = () => {
  const possiblePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  return null;
};
```

## 网络优化建议

### 配置DNS
```bash
# 使用国内DNS服务器
echo "nameserver 114.114.114.114" | sudo tee /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
```

### 配置apt镜像源
```bash
# 备份原始源
sudo cp /etc/apt/sources.list /etc/apt/sources.list.backup

# 使用阿里云镜像源
sudo sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
sudo sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
```

推荐使用方案1的国内镜像源，这是最稳定可靠的解决方案。