// 提示词优化演示
// 展示优化前后的提示词对比

console.log('=== 绘本工坊提示词优化演示 ===\n')

// 模拟优化前的简单提示词
const oldStoryPrompt = `请为3-6岁儿童创作一个绘本故事，要求如下：

角色信息：
小兔子（4岁，女）：活泼可爱，喜欢蹦蹦跳跳

故事梗概：小兔子去森林里寻找彩虹

风格约束：温馨童真，富有教育意义

要求：
1. 生成5个段落的完整童话故事
2. 每个段落30-70字
3. 语言简单易懂，适合3-6岁儿童

输出格式：
标题：[故事标题]
第1段：[内容]
第2段：[内容]
...`

// 模拟优化后的专业提示词
const newStoryPrompt = `你是一位获得国际童书大奖的儿童绘本作家，请创作一个精彩的绘本故事。

【创作背景】
- 目标读者：3-6岁儿童
- 故事长度：5个段落
- 创作风格：语言温暖亲切，情节简单纯真，充满爱与关怀的氛围
- 语言特点：使用最简单的词汇，多用叠词和拟声词，句子短小精悍，每句不超过10个字

【角色设定】
小兔子：4岁女孩，活泼可爱，喜欢蹦蹦跳跳

【故事梗概】
小兔子去森林里寻找彩虹

【专业创作要求】
1. 故事结构：遵循经典的起承转合结构
2. 语言艺术：重要词汇要多次重复，加深印象，语言要有明显的节奏感，便于记忆
3. 情感设计：传达轻柔温和的情感基调
4. 教育价值：自然融入温暖、关爱、纯真、安全感等正面价值
5. 画面感：每段都要有丰富的视觉元素，便于插图创作

【输出格式】
标题：[8字以内的吸引人标题]
第1段：[开头段落，建立情境]
第2段：[发展段落，推进情节]
第3段：[发展段落，推进情节]
第4段：[发展段落，推进情节]
第5段：[结尾段落，传递价值]`

console.log('📝 优化前的故事生成提示词：')
console.log('─'.repeat(50))
console.log(oldStoryPrompt)
console.log('\n')

console.log('✨ 优化后的故事生成提示词：')
console.log('─'.repeat(50))
console.log(newStoryPrompt)
console.log('\n')

console.log('🎯 主要改进点：')
console.log('1. 专业角色定位：从普通要求变为"获奖儿童绘本作家"')
console.log('2. 年龄适配语言：根据4岁儿童特点调整语言复杂度')
console.log('3. 风格细化：将"温馨童真"具体化为详细的创作指导')
console.log('4. 结构化要求：明确起承转合的专业故事结构')
console.log('5. 教育价值：具体化为"温暖、关爱、纯真、安全感"等关键词')
console.log('6. 画面感强化：每段都要求有丰富的视觉元素')

console.log('\n🚀 预期效果：')
console.log('- 故事质量更专业，符合儿童认知发展')
console.log('- 语言更适合目标年龄段，便于理解和记忆')
console.log('- 教育价值更自然地融入故事情节')
console.log('- 每段都有强烈的画面感，便于后续插图创作')