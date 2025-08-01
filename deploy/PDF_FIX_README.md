# PDF下载问题修复 - 快速指南

## 🚨 问题现象
PDF下载时报错：`Could not find Chrome (ver. 138.0.7204.168)`

## 🚀 一键修复
在阿里云服务器上运行：

```bash
# 进入项目目录
cd /root/StoryBookMaker  # 或你的实际项目路径

# 运行修复脚本
sudo ./deploy/quick-fix-pdf.sh

# 重启应用
./deploy/restart.sh
```

## 🔍 如果修复失败
运行诊断脚本查看详细信息：

```bash
./deploy/diagnose-pdf-issue.sh
```

## 📞 需要帮助？
查看详细修复指南：`docs/pdf-download-fix-guide.md`

---
**修复原理**: 安装Chrome浏览器，让Puppeteer能够生成PDF文件。