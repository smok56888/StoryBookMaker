# Gitee导入GitHub仓库指南

## 问题：密码错误

GitHub在2021年8月后不再支持密码认证，需要使用Personal Access Token。

## 解决方案

### 方案1: 使用GitHub Personal Access Token (推荐)

#### 步骤1: 生成GitHub Token
1. 访问 [GitHub Settings](https://github.com/settings/tokens)
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置Token名称: `Gitee Import`
4. 选择过期时间: 建议选择 `30 days` 或 `90 days`
5. 勾选权限:
   - ✅ `repo` (完整仓库访问权限)
   - ✅ `read:user` (读取用户信息)
6. 点击 "Generate token"
7. **重要**: 立即复制生成的token，离开页面后无法再次查看

#### 步骤2: 在Gitee中使用Token
1. 回到Gitee导入页面
2. Git仓库URL: `https://github.com/smok56888/StoryBookMaker.git`
3. 账号: 填写你的GitHub用户名 `smok56888`
4. 个人令牌: 粘贴刚才复制的GitHub Token（不是密码！）
5. 点击导入

### 方案2: 临时设为公开仓库

#### 步骤1: 将GitHub仓库设为公开
1. 访问 [你的GitHub仓库](https://github.com/smok56888/StoryBookMaker)
2. 点击 "Settings" 标签
3. 滚动到页面底部 "Danger Zone"
4. 点击 "Change repository visibility"
5. 选择 "Make public"
6. 输入仓库名确认: `smok56888/StoryBookMaker`

#### 步骤2: 在Gitee导入公开仓库
1. 回到Gitee导入页面
2. Git仓库URL: `https://github.com/smok56888/StoryBookMaker.git`
3. 由于是公开仓库，不需要填写账号密码
4. 直接点击导入

#### 步骤3: 导入完成后恢复私有
1. 导入完成后，可以将GitHub仓库重新设为私有
2. 在GitHub仓库 Settings → Danger Zone → Change repository visibility → Make private

### 方案3: 手动创建Gitee仓库并推送

如果导入仍有问题，可以手动创建：

#### 步骤1: 在Gitee创建空仓库
1. 访问 [Gitee](https://gitee.com)
2. 点击右上角 "+" → "新建仓库"
3. 仓库名称: `StoryBookMaker`
4. 选择 "公开"
5. 不要勾选 "使用Readme文件初始化这个仓库"
6. 点击 "创建"

#### 步骤2: 本地推送到Gitee
```bash
# 添加Gitee远程仓库
git remote add gitee https://gitee.com/你的gitee用户名/StoryBookMaker.git

# 推送代码
git push gitee main
```

## 推荐流程

1. **最简单**: 使用方案2，临时设为公开仓库导入
2. **最安全**: 使用方案1，创建Personal Access Token
3. **最灵活**: 使用方案3，手动创建并推送

## 导入完成后

无论使用哪种方案，导入完成后你的Gitee仓库地址将是：
```
https://gitee.com/你的gitee用户名/StoryBookMaker.git
```

然后就可以在阿里云ECS上使用这个地址克隆项目了：
```bash
git clone https://gitee.com/你的gitee用户名/StoryBookMaker.git
```

## 注意事项

1. **Token安全**: Personal Access Token具有很高的权限，使用后建议及时删除
2. **仓库同步**: 导入后的Gitee仓库不会自动同步GitHub更新，需要手动推送
3. **权限设置**: 确保Gitee仓库设为公开，这样ECS才能直接克隆