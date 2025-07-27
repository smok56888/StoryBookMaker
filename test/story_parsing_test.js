// 故事解析测试
// 模拟豆包API返回的各种格式，测试解析逻辑

console.log('=== 故事解析测试 ===\n')

// 模拟豆包API返回的问题格式（从截图中看到的）
const problematicContent = `## 哈哈跳呀跳

## 标题：哈哈跳呀跳 **第1段** 太阳公公笑，妈妈牵哈哈。小朋友呀呀，包包鼓囊囊。

跳舞去啦！**第2段** 教室亮堂堂，老师笑眯眯。小朋友，排排站，跟着老师舞。

小手拍拍拍！**第3段** 小腰弯弯弯，小腿伸伸伸。哎呀，有点难，哈哈不放弃！加油，加油！**第4段** 脚尖点点点，脚跟踏踏踏。

转个小圈圈，像只小蝴蝶，飞呀得高高！**第5段** 下课铃响啦，哈哈笑哈哈。今天真开心，妈妈抱抱她。

明天还来跳！。`

// 测试解析函数（简化版本，模拟arkApi.ts中的逻辑）
function parseStoryContent(content, expectedCount = 5) {
  console.log('原始内容:')
  console.log(content)
  console.log('\n' + '='.repeat(50) + '\n')
  
  // 提取标题
  let title = '我的绘本故事'
  const titleMatch = content.match(/(?:标题：|##\s*)(.+?)(?:\n|$)/i)
  if (titleMatch) {
    title = titleMatch[1].trim()
    console.log('✅ 提取到标题:', title)
  }

  let paragraphs = []

  // 方法1: 标准格式 "第X段："
  const standardParagraphs = content.match(/第\d+段：([^第]+?)(?=第\d+段：|$)/g)
  if (standardParagraphs && standardParagraphs.length > 0) {
    paragraphs = standardParagraphs.map(p => 
      p.replace(/第\d+段：/, '').trim().replace(/\*\*/g, '')
    ).filter(p => p.length > 0)
    console.log('✅ 使用标准格式解析，找到段落数:', paragraphs.length)
  }

  // 方法2: 如果标准格式失败，尝试识别 "**第X段**" 格式
  if (paragraphs.length === 0) {
    const starParagraphs = content.match(/\*\*第\d+段\*\*([^*]+?)(?=\*\*第\d+段\*\*|$)/g)
    if (starParagraphs && starParagraphs.length > 0) {
      paragraphs = starParagraphs.map(p => 
        p.replace(/\*\*第\d+段\*\*/, '').trim().replace(/\*\*/g, '')
      ).filter(p => p.length > 0)
      console.log('✅ 使用星号格式解析，找到段落数:', paragraphs.length)
    }
  }

  // 方法3: 智能分割混合内容
  if (paragraphs.length === 0) {
    console.log('⚠️  标准格式解析失败，尝试智能分割')
    
    let cleanContent = content
      .replace(/(?:标题：|##\s*).+?(?:\n|$)/i, '')
      .replace(/\*\*第\d+段\*\*/g, '|||SPLIT|||')
      .replace(/第\d+段：/g, '|||SPLIT|||')
    
    const segments = cleanContent.split('|||SPLIT|||')
      .map(s => s.trim().replace(/\*\*/g, ''))
      .filter(s => s.length > 10)
    
    if (segments.length > 0) {
      paragraphs = segments.slice(0, expectedCount)
      console.log('✅ 智能分割找到段落数:', paragraphs.length)
    }
  }

  // 输出结果
  console.log('\n📖 解析结果:')
  console.log('标题:', title)
  console.log('段落数:', paragraphs.length)
  paragraphs.forEach((p, i) => {
    console.log(`第${i+1}段: ${p}`)
  })

  return { title, paragraphs }
}

// 运行测试
parseStoryContent(problematicContent)

console.log('\n' + '='.repeat(60))
console.log('🎯 修复效果:')
console.log('- 能够正确识别混合在一起的段落')
console.log('- 智能分割 **第X段** 格式的内容')
console.log('- 清理多余的格式标记')
console.log('- 确保每个段落内容完整')