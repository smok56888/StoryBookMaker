# 阿里云部署环境变量配置指南

## 🚀 快速配置

### 1. 复制配置文件
```bash
# 在项目根目录执行
cp .env.demo .env.local
```

### 2. 编辑配置文件
```bash
# 使用你喜欢的编辑器
nano .env.local
# 或者
vim .env.local
```

## 🔑 必须配置的参数

### 豆包API密钥（必须）
```bash
ARK_API_KEY=your_doubao_api_key_here
```

**获取方式：**
1. 访问 [豆包开放平台](https://console.volcengine.com/ark)
2. 登录你的账号
3. 进入 API管理 -> 创建API密钥
4. 复制生成的API密钥

## 🌐 阿里云部署优化配置

### 1. 服务器性能优化
```bash
# 根据你的阿里云服务器配置调整内存限制
NODE_OPTIONS=--max-old-space-size=2048  # 2GB内存服务器
NODE_OPTIONS=--max-old-space-size=4096  # 4GB内存服务器
NODE_OPTIONS=--max-old-space-size=8192  # 8GB内存服务器
```

### 2. 网络优化
```bash
# 如果网络较慢，可以增加超时时间
API_TIMEOUT=90000           # API请求超时90秒
IMAGE_GENERATION_TIMEOUT=120000  # 图片生成超时120秒
```

### 3. 生产环境配置
```bash
NODE_ENV=production
LOG_LEVEL=production
ENABLE_API_LOGGING=false    # 关闭详细日志以提高性能
```

## 🔧 可选配置

### 1. 自定义域名
```bash
# 如果你有自己的域名
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 2. CDN加速
```bash
# 如果使用阿里云CDN
NEXT_PUBLIC_CDN_URL=https://your-cdn-domain.com
```

### 3. 端口配置
```bash
# 如果需要使用其他端口（默认3000）
PORT=8080
```

## 📋 配置验证

### 1. 检查配置文件
```bash
# 确保文件存在且格式正确
cat .env.local | grep ARK_API_KEY
```

### 2. 测试API连接
```bash
# 启动应用后访问健康检查接口
curl http://localhost:3000/api/health
```

## 🚨 安全注意事项

### 1. 保护API密钥
- ✅ 不要将 `.env.local` 提交到Git仓库
- ✅ 定期更换API密钥
- ✅ 使用最小权限原则

### 2. 服务器安全
```bash
# 设置文件权限
chmod 600 .env.local

# 确保只有应用用户可以读取
chown app:app .env.local
```

## 🔍 常见问题排查

### 1. API密钥无效
```bash
# 检查密钥格式
echo $ARK_API_KEY | wc -c  # 应该是36个字符（包含连字符）
```

### 2. 网络连接问题
```bash
# 测试豆包API连通性
curl -I https://ark.cn-beijing.volces.com/api/v3
```

### 3. 内存不足
```bash
# 检查内存使用
free -h
# 调整NODE_OPTIONS中的内存限制
```

## 📊 性能监控

### 1. 应用监控
```bash
# 查看应用日志
tail -f app.log

# 监控内存使用
ps aux | grep node
```

### 2. API调用监控
```bash
# 如果启用了API日志
grep "豆包API" app.log | tail -20
```

## 🔄 配置更新

### 1. 修改配置后重启
```bash
# 重启应用使配置生效
./deploy/restart.sh
```

### 2. 验证新配置
```bash
# 检查应用状态
./deploy/status.sh
```

## 💡 最佳实践

1. **备份配置**：定期备份 `.env.local` 文件
2. **版本控制**：使用 `.env.demo` 作为模板，不要提交实际密钥
3. **监控告警**：设置API调用失败的告警机制
4. **定期检查**：定期检查API密钥的有效性和使用量
5. **性能优化**：根据实际使用情况调整超时和内存配置

## 📞 技术支持

如果遇到配置问题：
1. 查看应用日志：`tail -f app.log`
2. 检查系统资源：`htop` 或 `top`
3. 验证网络连接：`ping ark.cn-beijing.volces.com`
4. 重新部署：`./deploy/simple-deploy-no-pm2.sh`