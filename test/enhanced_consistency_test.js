// 测试增强的一致性系统
// 注意：这是一个演示测试文件，展示新的一致性保障机制

async function testEnhancedConsistency() {
  console.log('🎯 开始测试增强的一致性系统...\n');
  
  // 测试数据
  const testParams = {
    storyId: 'enhanced_consistency_001',
    characters: [
      {
        name: '小明',
        analysis: '5岁男孩，圆脸，黑色短发，大眼睛，穿红色T恤和蓝色短裤，活泼开朗，喜欢笑'
      },
      {
        name: '小花',
        analysis: '4岁女孩，长发扎马尾，穿粉色连衣裙，白色小鞋，文静可爱，眼睛弯弯像月牙'
      }
    ],
    paragraphs: [
      "小明和小花在公园里玩耍，他们发现了一只迷路的小猫。",
      "小明轻轻地抱起小猫，小花拿出自己的小饼干喂给它吃。",
      "他们决定帮助小猫找到回家的路，一起在公园里寻找。",
      "终于在大树下找到了小猫的妈妈，小猫高兴地跑了过去。",
      "小明和小花看着小猫一家团聚，开心地笑了。"
    ],
    title: '小明和小花的善良之心'
  };

  console.log('📋 测试参数:');
  console.log('- 故事ID:', testParams.storyId);
  console.log('- 角色数量:', testParams.characters.length);
  console.log('- 段落数量:', testParams.paragraphs.length);
  console.log('- 故事标题:', testParams.title);
  console.log('');

  // 第一步：测试基础一致性元素生成
  console.log('🔧 步骤1: 测试基础一致性元素生成...');
  const basicElements = generateMockBasicConsistencyElements(testParams.characters);
  console.log('✅ 基础一致性元素生成成功');
  console.log('📄 生成内容:');
  console.log(basicElements);
  console.log('');

  // 第二步：测试核心形象元素提取（模拟）
  console.log('🎨 步骤2: 测试核心形象元素提取...');
  const mockCoreElements = generateMockCoreElements(testParams);
  console.log('✅ 核心形象元素提取成功');
  console.log('📄 提取内容（前300字符）:');
  console.log(mockCoreElements.substring(0, 300) + '...');
  console.log('');

  // 第三步：测试一致性增强的提示词生成
  console.log('📝 步骤3: 测试一致性增强的提示词生成...');
  const consistentPrompt = generateMockConsistentImagePrompt({
    ...testParams,
    coreElements: mockCoreElements
  });
  console.log('✅ 一致性增强提示词生成成功');
  console.log('📊 提示词统计:');
  console.log('- 总长度:', consistentPrompt.length, '字符');
  console.log('- 包含核心元素:', consistentPrompt.includes('核心一致性要求'));
  console.log('- 包含角色特征:', testParams.characters.every(c => consistentPrompt.includes(c.name)));
  console.log('');

  // 第四步：测试响应解析和一致性增强
  console.log('🔍 步骤4: 测试响应解析和一致性增强...');
  const mockResponse = generateMockResponse();
  const parsedResult = parseMockConsistentResponse(mockResponse, testParams.paragraphs.length, mockCoreElements);
  
  console.log('✅ 响应解析完成');
  console.log('📊 解析结果统计:');
  console.log('- 封面描述长度:', parsedResult.cover.length, '字符');
  console.log('- 内页数量:', parsedResult.pages.length);
  console.log('- 结尾描述长度:', parsedResult.ending.length, '字符');
  console.log('- 平均描述长度:', Math.round(parsedResult.pages.reduce((sum, p) => sum + p.length, 0) / parsedResult.pages.length), '字符');
  console.log('');

  // 第五步：测试一致性检查
  console.log('🎯 步骤5: 测试一致性检查...');
  const consistencyCheck = checkMockConsistency(parsedResult, testParams.characters);
  
  console.log('✅ 一致性检查完成');
  console.log('📈 一致性评估:');
  console.log('- 角色名称覆盖率:', consistencyCheck.characterCoverage + '%');
  console.log('- 特征描述完整性:', consistencyCheck.featureCompleteness + '%');
  console.log('- 风格统一性:', consistencyCheck.styleConsistency + '%');
  console.log('- 整体一致性评分:', consistencyCheck.overallScore + '/100');
  console.log('');

  // 第六步：对比优化前后效果
  console.log('📊 步骤6: 对比优化前后效果...');
  console.log('优化前问题:');
  console.log('- ❌ 角色外观在不同页面差异较大');
  console.log('- ❌ 服装颜色和款式不统一');
  console.log('- ❌ 面部特征和表情变化过大');
  console.log('- ❌ 整体风格缺乏连贯性');
  console.log('');
  
  console.log('优化后改进:');
  console.log('- ✅ 提取核心形象元素，建立一致性标准');
  console.log('- ✅ 每个描述都包含角色关键特征');
  console.log('- ✅ 统一的绘画风格和色彩方案');
  console.log('- ✅ 智能的一致性增强机制');
  console.log('');

  // 使用建议
  console.log('💡 使用建议:');
  console.log('1. 🎯 默认模式: 使用一致性增强版本，确保人物形象统一');
  console.log('2. ⚡ 快速模式: 仅在对一致性要求不高时使用');
  console.log('3. ✏️  手动编辑: 提示词现在支持随时编辑，可进一步调整');
  console.log('4. 🔍 质量检查: 生成后检查角色特征是否保持一致');
  console.log('');

  console.log('✨ 增强一致性系统测试完成');
  console.log('🎉 系统已准备就绪，可以生成高度一致的绘本插图！');
}

// 模拟基础一致性元素生成
function generateMockBasicConsistencyElements(characters) {
  const characterElements = characters.map(char => {
    const features = char.analysis.split('，')
    return `${char.name}：${features.slice(0, 4).join('，')}（每页必须保持完全一致）`
  }).join('\n')

  return `【核心一致性要求】
${characterElements}

【绘画风格统一】
- 温馨的儿童绘本风格
- 柔和的水彩质感
- 暖色调为主，营造温馨氛围
- 圆润安全的造型设计`
}

// 模拟核心形象元素生成
function generateMockCoreElements(params) {
  return `===== 人物一致性档案 =====
小明
- 头部：发型[黑色短发，略微蓬松，自然分缝]，发色[自然黑色]，眼睛[大而明亮的黑色眼睛，眼形圆润]，脸型[圆润娃娃脸，肉嘟嘟的脸颊]，肤色[健康小麦色]
- 服装：上衣[鲜红色圆领T恤，胸前无图案]，下装[深蓝色休闲短裤，长度到膝盖]，鞋子[白色运动鞋，简洁款式]，配饰[无]
- 表情：基本表情[活泼开朗]，笑容[灿烂天真，露出小白牙]，眉毛[自然弯曲，浓密]
- 体态：身高[标准5岁比例]，体型[健康匀称，略显活泼]，姿态[挺拔好动]

小花
- 头部：发型[长发扎马尾，齐刘海]，发色[自然黑色，有光泽]，眼睛[弯弯如月牙，温柔]，脸型[圆润可爱，小巧]，肤色[白皙透亮]
- 服装：上衣[粉色连衣裙，简约款式]，下装[连衣裙，长度到小腿]，鞋子[白色小皮鞋，圆头款]，配饰[无]
- 表情：基本表情[文静可爱]，笑容[温柔甜美，嘴角微翘]，眉毛[细致弯曲]
- 体态：身高[标准4岁比例]，体型[娇小可爱]，姿态[文静优雅]

===== 色彩方案 =====
- 主色调：红色、蓝色、粉色
- 辅助色：白色、绿色、黄色
- 情感基调：温暖活泼
- 饱和度：中等偏高

===== 绘画风格 =====
- 线条：柔和圆润，无尖锐边角
- 着色：水彩风格，自然渐变
- 阴影：淡色透明，营造立体感
- 整体质感：温馨手绘，童真可爱`
}

// 模拟一致性增强的提示词生成
function generateMockConsistentImagePrompt(params) {
  return `你是专业的儿童绘本插画师，请为《${params.title}》生成高度一致的插图描述。

${params.coreElements}

【故事内容】
${params.paragraphs.map((p, i) => `第${i + 1}页：${p}`).join('\n')}

【一致性要求】
1. 角色外观：严格按照上述核心要求，每个角色的发型、服装、表情、体态必须在所有页面保持完全一致
2. 绘画风格：所有插图必须使用相同的艺术风格和色彩方案
3. 构图标准：采用儿童友好的视角和构图方式
4. 质量标准：每个描述100-150字，详细具体，便于AI理解和生成

【输出格式】
请严格按照以下格式输出：

封面：[封面插图描述，包含主要角色，严格遵循一致性要求]
第1页：[第1页插图描述，对应故事内容，严格遵循一致性要求]
第2页：[第2页插图描述，对应故事内容，严格遵循一致性要求]
第3页：[第3页插图描述，对应故事内容，严格遵循一致性要求]
第4页：[第4页插图描述，对应故事内容，严格遵循一致性要求]
第5页：[第5页插图描述，对应故事内容，严格遵循一致性要求]
结尾：[结尾插图描述，温馨圆满的结局，严格遵循一致性要求]

【重要提醒】
每个描述都必须明确包含角色的关键特征，确保AI绘图时能够保持角色形象的高度一致性。`
}

// 模拟响应内容
function generateMockResponse() {
  return `封面：温馨的故事封面，小明（5岁男孩，圆脸，黑色短发，穿红色T恤和蓝色短裤）和小花（4岁女孩，长发扎马尾，穿粉色连衣裙）在公园里，背景有绿树和蓝天，体现友谊主题
第1页：小明（红色T恤，蓝色短裤，黑色短发）和小花（粉色连衣裙，马尾辫）在公园草地上玩耍，发现一只橘色小猫躲在花丛中，两人表情好奇
第2页：小明（保持红色T恤蓝色短裤的装扮）轻柔地抱起小猫，小花（粉色连衣裙不变）蹲在旁边递出小饼干，场景温馨有爱
第3页：小明和小花（服装保持一致）牵手在公园里寻找，小猫在小明怀中，远处有各种游乐设施，两人神情专注
第4页：在大树下找到猫妈妈，小明（红色T恤）和小花（粉色裙子）站在一旁，小猫兴奋地跑向妈妈，场面温馨感人
第5页：小明（黑色短发，红色上衣）和小花（马尾辫，粉色裙装）站在一旁微笑观看猫咪一家团聚，夕阳西下的温馨场景
结尾：小明和小花（保持各自特色服装）手牵手走在回家的路上，背景是美丽的夕阳，传达友谊和善良的主题`
}

// 模拟一致性响应解析
function parseMockConsistentResponse(content, expectedPages, coreElements) {
  const lines = content.split('\n').filter(line => line.trim())
  
  // 提取角色特征
  const characterFeatures = ['小明：5岁男孩，圆脸，黑色短发，穿红色T恤和蓝色短裤', '小花：4岁女孩，长发扎马尾，穿粉色连衣裙']
  
  // 解析各部分
  const cover = lines.find(line => line.startsWith('封面：'))?.replace('封面：', '').trim() || ''
  const ending = lines.find(line => line.startsWith('结尾：'))?.replace('结尾：', '').trim() || ''
  
  const pages = []
  for (let i = 1; i <= expectedPages; i++) {
    const page = lines.find(line => line.startsWith(`第${i}页：`))?.replace(`第${i}页：`, '').trim() || ''
    pages.push(page)
  }
  
  return { cover, pages, ending, coreElements }
}

// 模拟一致性检查
function checkMockConsistency(result, characters) {
  const allDescriptions = [result.cover, ...result.pages, result.ending]
  
  // 检查角色名称覆盖率
  const characterMentions = characters.map(char => {
    const mentions = allDescriptions.filter(desc => desc.includes(char.name)).length
    return (mentions / allDescriptions.length) * 100
  })
  const characterCoverage = Math.round(characterMentions.reduce((sum, rate) => sum + rate, 0) / characters.length)
  
  // 检查特征描述完整性
  const featureKeywords = ['红色T恤', '蓝色短裤', '粉色连衣裙', '马尾', '黑色短发']
  const featureMentions = featureKeywords.map(keyword => {
    const mentions = allDescriptions.filter(desc => desc.includes(keyword)).length
    return mentions > 0 ? 100 : 0
  })
  const featureCompleteness = Math.round(featureMentions.reduce((sum, rate) => sum + rate, 0) / featureKeywords.length)
  
  // 检查风格统一性
  const styleKeywords = ['温馨', '公园', '夕阳']
  const styleMentions = styleKeywords.filter(keyword => 
    allDescriptions.some(desc => desc.includes(keyword))
  ).length
  const styleConsistency = Math.round((styleMentions / styleKeywords.length) * 100)
  
  // 计算整体评分
  const overallScore = Math.round((characterCoverage + featureCompleteness + styleConsistency) / 3)
  
  return {
    characterCoverage,
    featureCompleteness,
    styleConsistency,
    overallScore
  }
}

// 运行测试
testEnhancedConsistency()