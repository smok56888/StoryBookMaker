# PDF中文字体显示问题修复指南

## 🚨 问题描述

PDF下载成功，但中文显示为方块字符（□□□），这是因为Linux服务器缺少中文字体。

## 🚀 快速修复方案

### 方案1: 一键修复（推荐）

```bash
# 在阿里云服务器上运行
sudo ./deploy/quick-fix-chinese-font.sh

# 重启应用
./deploy/restart.sh
```

### 方案2: 完整修复

```bash
# 运行完整的字体修复脚本
sudo ./deploy/fix-chinese-fonts.sh

# 重启应用
./deploy/restart.sh
```

## 🔧 手动修复步骤

如果自动修复失败，可以手动执行：

### 1. 安装中文字体包

**CentOS/RHEL:**
```bash
sudo yum install -y fontconfig
sudo yum install -y wqy-microhei-fonts google-noto-cjk-fonts
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y fontconfig fonts-wqy-microhei fonts-noto-cjk
```

### 2. 下载思源黑体（推荐）

```bash
# 创建字体目录
sudo mkdir -p /usr/share/fonts/chinese

# 下载思源黑体
cd /tmp
wget https://github.com/googlefonts/noto-cjk/releases/download/Sans2.004/01_NotoSansCJK.ttc.zip
unzip 01_NotoSansCJK.ttc.zip
sudo cp NotoSansCJK.ttc /usr/share/fonts/chinese/
```

### 3. 更新字体缓存

```bash
sudo fc-cache -fv
```

### 4. 验证字体安装

```bash
# 检查中文字体
fc-list :lang=zh-cn

# 应该看到类似输出：
# /usr/share/fonts/chinese/NotoSansCJK.ttc: Noto Sans CJK SC:style=Regular
```

## 🧪 测试修复效果

修复完成后：

1. 重启应用：`./deploy/restart.sh`
2. 访问应用创建新故事
3. 下载PDF测试中文显示

## 📋 技术原理

- **问题原因**: Linux服务器默认不包含中文字体
- **解决方案**: 安装中文字体并配置字体优先级
- **字体选择**: 优先使用思源黑体，备用文泉驿微米黑

## 🔍 故障排除

### 如果中文仍显示异常：

1. **检查字体安装**:
   ```bash
   fc-list :lang=zh-cn | wc -l
   ```

2. **检查应用重启**:
   ```bash
   ps aux | grep node
   ```

3. **查看字体配置**:
   ```bash
   cat /etc/fonts/local.conf
   ```

### 常见问题：

- **字体下载失败**: 网络问题，尝试手动下载
- **权限问题**: 确保使用sudo运行修复脚本
- **缓存未更新**: 手动运行 `sudo fc-cache -fv`

## 💡 预防措施

在部署脚本中添加字体安装步骤，避免将来出现同样问题。