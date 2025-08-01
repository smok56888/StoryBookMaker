# 应用重启问题排查指南

## 🚨 常见问题

### 问题1: 端口占用错误
```
Error: listen EADDRINUSE: address already in use :::3000
```

**原因**: 旧进程没有完全停止，端口3000仍被占用

**解决方案**:
```bash
# 方案1: 使用强制停止脚本
./deploy/force-stop.sh
./deploy/start.sh

# 方案2: 手动清理端口
fuser -k 3000/tcp
./deploy/restart.sh

# 方案3: 查找并终止进程
netstat -tlnp | grep :3000
kill -9 [PID]
```

### 问题2: 进程启动后立即退出
**检查方法**:
```bash
# 查看错误日志
tail -20 app.log

# 检查构建文件
ls -la .next/

# 手动启动测试
npm start
```

### 问题3: 启动超时
**解决方案**:
```bash
# 检查系统资源
free -h
df -h

# 重新构建
npm run build
./deploy/restart.sh
```

## 🔧 改进的重启流程

### 新的脚本特性

1. **更强的进程清理**:
   - 优雅停止 → 强制终止
   - 多重进程检查
   - 端口释放验证

2. **智能启动检查**:
   - 进程存活检查
   - 端口监听检查  
   - HTTP服务就绪检查

3. **强制停止脚本**:
   - `./deploy/force-stop.sh` - 处理顽固进程

### 推荐的重启流程

```bash
# 标准重启
./deploy/restart.sh

# 如果失败，使用强制重启
./deploy/force-stop.sh
./deploy/start.sh

# 检查状态
./deploy/status.sh
```

## 🔍 故障排除步骤

### 1. 检查当前状态
```bash
# 检查进程
ps aux | grep node

# 检查端口
netstat -tlnp | grep 3000

# 检查PID文件
cat app.pid 2>/dev/null
```

### 2. 清理环境
```bash
# 强制停止所有相关进程
./deploy/force-stop.sh

# 验证清理结果
ps aux | grep node
netstat -tlnp | grep 3000
```

### 3. 重新启动
```bash
# 检查构建文件
ls -la .next/

# 启动应用
./deploy/start.sh

# 监控启动过程
tail -f app.log
```

## 📋 预防措施

1. **定期清理**:
   ```bash
   # 每天清理一次临时文件
   rm -f nohup.out
   rm -rf .next/cache/webpack/server-development/*.pack*
   ```

2. **监控资源**:
   ```bash
   # 检查内存使用
   free -h
   
   # 检查磁盘空间
   df -h
   ```

3. **日志轮转**:
   ```bash
   # 定期清理大日志文件
   if [ -f app.log ] && [ $(stat -f%z app.log 2>/dev/null || stat -c%s app.log) -gt 10485760 ]; then
       mv app.log app.log.old
   fi
   ```

## 🚀 最佳实践

1. **使用改进的脚本**:
   - `./deploy/restart.sh` - 标准重启
   - `./deploy/force-stop.sh` - 强制清理
   - `./deploy/status.sh` - 状态检查

2. **监控应用健康**:
   ```bash
   # 定期检查应用状态
   ./deploy/status.sh
   
   # 查看最近日志
   tail -20 app.log
   ```

3. **自动化监控**:
   ```bash
   # 创建监控脚本
   #!/bin/bash
   if ! curl -s http://localhost:3000 >/dev/null; then
       echo "应用异常，尝试重启..."
       ./deploy/restart.sh
   fi
   ```

## 📞 获取帮助

如果问题仍然存在：

1. **收集诊断信息**:
   ```bash
   echo "=== 系统信息 ===" > debug.log
   uname -a >> debug.log
   echo "=== 进程信息 ===" >> debug.log
   ps aux | grep node >> debug.log
   echo "=== 端口信息 ===" >> debug.log
   netstat -tlnp | grep 3000 >> debug.log
   echo "=== 应用日志 ===" >> debug.log
   tail -50 app.log >> debug.log
   ```

2. **尝试手动启动**:
   ```bash
   npm start
   ```

3. **检查系统资源**:
   ```bash
   top
   df -h
   free -h
   ```