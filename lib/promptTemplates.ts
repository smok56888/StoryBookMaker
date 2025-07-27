// 提示词模板配置文件
// 用于管理和优化各种AI生成任务的提示词

export interface StoryPromptParams {
  characters: Array<{ name: string; age: string; gender: string; analysis?: string }>
  outline: string
  style: string
  count: number
}

export interface ImagePromptParams {
  storyId: string
  characters: Array<{ name: string; analysis: string }>
  paragraphs: string[]
  title: string
}

// 故事风格映射
export const STORY_STYLE_MAP = {
  '温馨童真': {
    description: '语言温暖亲切，情节简单纯真，充满爱与关怀的氛围',
    keywords: ['温暖', '关爱', '纯真', '安全感'],
    tone: '轻柔温和'
  },
  '冒险探索': {
    description: '充满好奇心和探索精神，鼓励勇敢尝试，培养独立性',
    keywords: ['勇敢', '探索', '发现', '成长'],
    tone: '积极向上'
  },
  '友谊成长': {
    description: '强调友谊的珍贵，展现合作互助，体现成长的快乐',
    keywords: ['友谊', '合作', '分享', '互助'],
    tone: '温暖友好'
  },
  '科普启蒙': {
    description: '融入科学知识，激发求知欲，用故事解释自然现象',
    keywords: ['好奇', '学习', '发现', '知识'],
    tone: '启发引导'
  },
  '品德教育': {
    description: '自然融入道德品质教育，通过故事传递正确价值观',
    keywords: ['诚实', '善良', '责任', '尊重'],
    tone: '引导教育'
  },
  '幽默搞笑': {
    description: '轻松幽默的语言风格，适度的搞笑情节，带来欢乐体验',
    keywords: ['有趣', '快乐', '幽默', '轻松'],
    tone: '活泼有趣'
  }
} as const

// 年龄段语言特点
export const AGE_LANGUAGE_MAP = {
  '3-4': {
    vocabulary: '最简单的词汇，多用叠词和拟声词',
    sentence: '句子短小精悍，每句不超过10个字',
    repetition: '重要词汇要多次重复，加深印象',
    rhythm: '语言要有明显的节奏感，便于记忆'
  },
  '5-6': {
    vocabulary: '适当增加词汇丰富度，引入新词汇',
    sentence: '可以使用简单的复合句，长度适中',
    repetition: '适度重复关键概念，培养语言感知',
    rhythm: '注重语言的韵律美，培养语感'
  }
} as const

// 插图风格配置
export const ILLUSTRATION_STYLES = {
  watercolor: {
    name: '水彩风格',
    description: '柔和的水彩渲染效果，色彩自然流畅',
    keywords: ['水彩', '柔和', '渐变', '自然']
  },
  cartoon: {
    name: '卡通风格',
    description: '可爱的卡通造型，线条清晰明快',
    keywords: ['卡通', '可爱', '清晰', '明快']
  },
  handDrawn: {
    name: '手绘风格',
    description: '温暖的手绘质感，富有人情味',
    keywords: ['手绘', '温暖', '质感', '人情味']
  }
} as const

// 色彩心理学配置
export const COLOR_PSYCHOLOGY = {
  warm: {
    primary: ['#FFE4B5', '#FFD700', '#FFA500'], // 暖黄、金黄、橙色
    secondary: ['#FFB6C1', '#FFC0CB'], // 粉色系
    emotion: '温暖、安全、快乐'
  },
  cool: {
    primary: ['#87CEEB', '#98FB98', '#E0FFFF'], // 天蓝、淡绿、淡青
    secondary: ['#DDA0DD', '#F0E68C'], // 淡紫、卡其
    emotion: '平静、清新、舒适'
  },
  balanced: {
    primary: ['#F0E68C', '#98FB98', '#FFB6C1'], // 平衡的暖冷色调
    secondary: ['#87CEEB', '#DDA0DD'],
    emotion: '和谐、平衡、友好'
  }
} as const

// 构图原则
export const COMPOSITION_RULES = {
  ruleOfThirds: '运用三分法则，将主体放在画面的黄金分割点上',
  childPerspective: '采用儿童视角，降低视点，让孩子有代入感',
  visualFlow: '创造自然的视觉流动路径，引导阅读方向',
  safeSpace: '保留足够的安全空间，避免画面过于拥挤',
  emotionalFocus: '突出情感表达的重点，通过构图强化故事情感'
} as const

// 导出提示词生成函数
export const generateStoryPrompt = (params: StoryPromptParams): string => {
  const styleInfo = STORY_STYLE_MAP[params.style as keyof typeof STORY_STYLE_MAP] || {
    description: params.style,
    keywords: [],
    tone: '温和友好'
  }
  
  const ageGroup = params.characters[0]?.age ? 
    (parseInt(params.characters[0].age) <= 4 ? '3-4' : '5-6') : '5-6'
  const languageInfo = AGE_LANGUAGE_MAP[ageGroup as keyof typeof AGE_LANGUAGE_MAP]
  
  return `你是一位获得国际童书大奖的儿童绘本作家，请创作一个精彩的绘本故事。

【创作背景】
- 目标读者：3-6岁儿童
- 故事长度：${params.count}个段落
- 创作风格：${styleInfo.description}
- 语言特点：${languageInfo.vocabulary}，${languageInfo.sentence}

【角色设定】
${params.characters.map(char => 
  `${char.name}：${char.age}岁${char.gender === 'male' ? '男孩' : '女孩'}${char.analysis ? '，' + char.analysis : ''}`
).join('\n')}

【故事梗概】
${params.outline}

【专业创作要求】
1. 故事结构：遵循经典的起承转合结构
2. 语言艺术：${languageInfo.repetition}，${languageInfo.rhythm}
3. 情感设计：传达${styleInfo.tone}的情感基调
4. 教育价值：自然融入${styleInfo.keywords.join('、')}等正面价值
5. 画面感：每段都要有丰富的视觉元素，便于插图创作

【输出格式】
标题：[8字以内的吸引人标题]
第1段：[开头段落，建立情境]
第2段：[发展段落，推进情节]
...
第${params.count}段：[结尾段落，传递价值]`
}

export const generateImagePrompt = (params: ImagePromptParams): string => {
  return `你是一位国际知名的儿童绘本插画艺术家，请为《${params.title}》创作专业插图描述。

【项目信息】
- 故事标题：《${params.title}》
- 目标读者：3-6岁儿童
- 插画风格：${ILLUSTRATION_STYLES.watercolor.description}

【角色一致性要求】
${params.characters.map(char => {
  const mainFeatures = char.analysis.split('，').slice(0, 3).join('，')
  return `${char.name}：${mainFeatures}（所有页面必须保持一致）`
}).join('\n')}

【故事内容】
${params.paragraphs.map((p, i) => `第${i + 1}页：${p}`).join('\n')}

【专业设计标准】
1. 构图原则：${COMPOSITION_RULES.ruleOfThirds}，${COMPOSITION_RULES.childPerspective}
2. 色彩方案：${COLOR_PSYCHOLOGY.warm.emotion}的${COLOR_PSYCHOLOGY.warm.primary.join('、')}色调
3. 视觉流动：${COMPOSITION_RULES.visualFlow}
4. 情感表达：${COMPOSITION_RULES.emotionalFocus}

【输出要求】
每页描述150-200字，包含角色、环境、构图、色彩、情感五个维度。

【输出格式】
封面：[封面插图描述，需包含标题设计]
第1页：[对应第1段的插图描述]
...
结尾页：[温馨结尾场景描述]`
}