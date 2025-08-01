# PDF中文字体修复 - 快速指南

## 🚨 问题现象
PDF下载成功，但中文显示为方块字符：□□□□

## 🚀 一键修复
在阿里云服务器上运行：

```bash
# 快速修复（推荐）
sudo ./deploy/quick-fix-chinese-font.sh

# 重启应用
./deploy/restart.sh
```

## 🔧 完整修复
如果快速修复不够：

```bash
# 完整修复
sudo ./deploy/fix-chinese-fonts.sh

# 重启应用  
./deploy/restart.sh
```

## ✅ 验证修复
```bash
# 检查中文字体
fc-list :lang=zh-cn

# 测试PDF下载
```

## 📞 需要帮助？
查看详细指南：`docs/chinese-font-fix-guide.md`

---
**修复原理**: 安装中文字体，让PDF能正确显示中文字符。