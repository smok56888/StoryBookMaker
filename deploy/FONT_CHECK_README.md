# 字体文件检查和安装指南

## 🔍 问题排查步骤

### 第1步：检查字体文件是否真实存在
```bash
# 运行字体文件检查脚本
./deploy/check-font-files.sh
```

这个脚本会检查：
- 系统字体目录中是否有字体文件
- fontconfig是否识别到中文字体
- 字体配置文件是否正确

### 第2步：如果字体文件不存在，直接安装
```bash
# 运行直接字体安装脚本
sudo ./deploy/direct-font-install.sh
```

这个脚本会：
- 从多个源下载中文字体文件
- 确保字体文件真实存在于系统中
- 创建强制字体配置
- 验证安装结果

### 第3步：重启应用测试
```bash
./deploy/restart.sh
```

## 🎯 预期结果

执行完成后，你应该能看到：

1. **字体文件存在**：
   ```bash
   ls -la /usr/share/fonts/chinese/
   # 应该显示 .ttf 或 .ttc 文件
   ```

2. **fontconfig识别**：
   ```bash
   fc-list :lang=zh-cn
   # 应该显示中文字体列表
   ```

3. **PDF中文正常显示**：
   - 下载PDF后中文不再是方块字符

## 🔧 如果仍然有问题

1. **检查网络连接**：字体下载需要网络
2. **检查磁盘空间**：确保有足够空间存储字体文件
3. **检查权限**：确保使用sudo运行安装脚本
4. **手动验证**：检查 `/usr/share/fonts/chinese/` 目录是否有文件

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：
```bash
# 收集诊断信息
./deploy/check-font-files.sh > font-diagnosis.txt
cat font-diagnosis.txt
```