# PDF下载问题修复指南

## 🚨 问题描述

在阿里云服务器上部署后，PDF下载功能报错：
```
Error: PDF生成失败: 所有PDF生成方案都失败: 主要方案(Could not find Chrome (ver. 138.0.7204.168))
```

这个错误表明服务器上没有安装Chrome浏览器，导致Puppeteer无法生成PDF。

## 🔧 快速修复方案

### 方案1: 一键修复（推荐）

在服务器上运行以下命令：

```bash
# 进入项目目录
cd /path/to/your/StoryBookMaker

# 给脚本执行权限
chmod +x deploy/quick-fix-pdf.sh

# 运行修复脚本（需要root权限）
sudo ./deploy/quick-fix-pdf.sh

# 重启应用
./deploy/restart.sh
```

### 方案2: 手动修复

如果自动修复失败，可以手动执行以下步骤：

#### 1. 安装Chrome浏览器

**CentOS/RHEL/Amazon Linux:**
```bash
# 下载Chrome RPM包
wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm

# 安装Chrome
sudo yum localinstall -y google-chrome-stable_current_x86_64.rpm
```

**Ubuntu/Debian:**
```bash
# 添加Google Chrome仓库
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list

# 更新包列表并安装
sudo apt-get update
sudo apt-get install -y google-chrome-stable
```

#### 2. 验证Chrome安装

```bash
# 检查Chrome是否安装成功
google-chrome --version

# 应该输出类似：Google Chrome 138.0.7204.168
```

#### 3. 重新安装Puppeteer

```bash
# 进入项目目录
cd /path/to/your/StoryBookMaker

# 强制重新安装Puppeteer
npm install puppeteer --force
```

#### 4. 重启应用

```bash
# 重启应用使更改生效
./deploy/restart.sh
```

## 🔍 问题诊断

如果修复后仍有问题，可以运行诊断脚本：

```bash
# 运行诊断脚本
chmod +x deploy/diagnose-pdf-issue.sh
./deploy/diagnose-pdf-issue.sh
```

诊断脚本会检查：
- 系统信息
- Chrome浏览器安装状态
- 项目目录和文件
- Puppeteer安装状态
- 系统依赖
- 应用运行状态

## 🧪 测试PDF功能

修复完成后，可以通过以下方式测试：

1. **访问应用**: 打开浏览器访问你的应用
2. **创建故事**: 创建一个新的故事
3. **下载PDF**: 点击下载PDF按钮
4. **检查日志**: 如果仍有问题，查看应用日志

```bash
# 查看应用日志
tail -f app.log

# 查看系统日志中的Chrome相关错误
sudo grep -i "chrome\|puppeteer" /var/log/messages
```

## 🔧 高级修复选项

### 完整环境修复

如果快速修复不起作用，可以运行完整的环境修复：

```bash
chmod +x deploy/fix-chrome-puppeteer.sh
sudo ./deploy/fix-chrome-puppeteer.sh
```

这个脚本会：
- 安装Chrome浏览器和所有依赖
- 配置Puppeteer
- 创建必要的符号链接
- 运行完整的测试

### 系统依赖安装

如果Chrome安装后仍有问题，可能需要安装额外的系统依赖：

**CentOS/RHEL:**
```bash
sudo yum install -y \
    libX11 libXcomposite libXcursor libXdamage libXext \
    libXi libXrandr libXss libXtst cups-libs libXScrnSaver \
    libxss libnss3 libgconf-2-4 libXrender libXfixes \
    libdrm libxkbcommon libxkbcommon-x11 libatspi \
    libgtk-3-0 libgdk-pixbuf2.0-0 xdg-utils libasound2
```

**Ubuntu/Debian:**
```bash
sudo apt-get install -y \
    libasound2 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
    libxss1 libgconf-2-4 libxrandr2 libasound2 \
    libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 \
    libgtk-3-0 libgdk-pixbuf2.0-0 libxcomposite1 \
    libxcursor1 libxdamage1 libxext6 libxfixes3 \
    libxi6 libxrender1 libxtst6 libcups2 libxss1 \
    ca-certificates fonts-liberation libappindicator3-1 \
    libnss3 lsb-release xdg-utils
```

## 🚀 预防措施

为了避免将来出现类似问题：

1. **在部署脚本中包含Chrome安装**
2. **定期更新Chrome浏览器**
3. **监控PDF生成功能**
4. **备份工作的环境配置**

## 📞 故障排除

### 常见错误和解决方案

#### 错误1: "Could not find Chrome"
**解决方案**: 安装Chrome浏览器
```bash
sudo ./deploy/quick-fix-pdf.sh
```

#### 错误2: "Permission denied"
**解决方案**: 检查Chrome可执行权限
```bash
sudo chmod +x /usr/bin/google-chrome
```

#### 错误3: "Failed to launch browser"
**解决方案**: 安装缺失的系统依赖
```bash
# 运行诊断脚本查看缺失的依赖
./deploy/diagnose-pdf-issue.sh
```

#### 错误4: "Timeout waiting for browser"
**解决方案**: 增加超时时间或检查系统资源
```bash
# 检查内存使用
free -h

# 检查CPU使用
top
```

### 获取帮助

如果问题仍然存在：

1. **收集诊断信息**:
   ```bash
   ./deploy/diagnose-pdf-issue.sh > diagnosis.txt
   ```

2. **查看详细日志**:
   ```bash
   tail -100 app.log
   ```

3. **检查系统资源**:
   ```bash
   df -h  # 磁盘空间
   free -h  # 内存使用
   ```

## 📋 修复检查清单

修复完成后，请确认以下项目：

- [ ] Chrome浏览器已安装并可执行
- [ ] Puppeteer模块已正确安装
- [ ] 应用已重启
- [ ] PDF下载功能正常工作
- [ ] 应用日志中无相关错误

## 🎯 总结

PDF下载问题主要是由于服务器缺少Chrome浏览器导致的。通过安装Chrome浏览器和重新配置Puppeteer，可以解决这个问题。建议使用提供的一键修复脚本来快速解决问题。