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

【输出格式要求】
请严格按照以下格式输出，每段独占一行：

标题：[8字以内的吸引人标题]

第1段：[开头段落，建立情境，40-80字]

第2段：[发展段落，推进情节，40-80字]

第3段：[发展段落，推进情节，40-80字]

第4段：[发展段落，推进情节，40-80字]

第5段：[结尾段落，传递价值，40-80字]

注意：
1. 每段前必须有"第X段："标识
2. 每段内容独占一行
3. 段落之间用空行分隔
4. 不要在段落中使用**等格式标记`
}

// 形象一致性配置
export const CONSISTENCY_RULES = {
  character: {
    essential: ['发型', '发色', '眼睛颜色', '眼睛形状', '脸型', '肤色', '身高比例'],
    clothing: ['主要服装颜色', '服装款式', '鞋子样式', '配饰特征'],
    expression: ['基本表情特点', '笑容特征', '眉毛形状'],
    posture: ['站姿特点', '手势习惯', '行走姿态']
  },
  objects: {
    shape: ['基本形状', '大小比例', '材质质感'],
    color: ['主色调', '次要颜色', '光泽度'],
    details: ['装饰元素', '纹理特征', '磨损程度']
  },
  environment: {
    layout: ['空间布局', '主要建筑', '地形特征'],
    lighting: ['光线方向', '明暗对比', '色温'],
    atmosphere: ['天气状况', '时间设定', '季节特征']
  }
} as const

// 生成核心形象提取提示词
export const generateCoreElementsPrompt = (params: ImagePromptParams): string => {
  return `你是一位专业的绘本视觉一致性顾问，拥有20年儿童绘本创作经验。请深度分析这个绘本故事，建立严格的视觉一致性标准。

【项目信息】
- 故事标题：《${params.title}》
- 目标读者：3-6岁儿童
- 插图总数：${params.paragraphs.length + 2}张（封面+${params.paragraphs.length}页内容+结尾页）

【角色档案】
${params.characters.map(char => `${char.name}：${char.analysis}`).join('\n')}

【完整故事脚本】
${params.paragraphs.map((p, i) => `第${i + 1}页：${p}`).join('\n')}

【一致性分析任务】
请建立以下视觉一致性档案，确保所有插图中的形象元素完全一致：

【核心人物档案】
对每个角色建立详细档案，包含：
- 基础外貌：发型（长度、卷直、刘海）、发色（具体色号）、眼睛（颜色、形状、大小）、脸型、肤色、身高体型
- 服装系统：上衣（颜色、款式、图案）、下装（颜色、款式、长度）、鞋袜（颜色、样式）、配饰（帽子、饰品等）
- 表情特征：基本表情、笑容特点、眉毛形状、嘴型特征
- 动作习惯：站姿、坐姿、手势、走路方式

【重要物品档案】
对故事中反复出现的物品建立档案：
- 外观规格：形状、大小、比例、材质
- 色彩方案：主色、辅色、光泽度、透明度
- 细节特征：装饰、纹理、磨损、标识

【场景环境档案】
对主要场景建立标准：
- 空间布局：房间结构、家具摆放、道路走向
- 建筑风格：墙面颜色、门窗样式、装饰元素
- 自然环境：植物种类、地面材质、天空状态
- 光照系统：光源位置、明暗分布、色温设定

【色彩一致性方案】
- 主色调：3-4种主要颜色（具体色号）
- 辅助色：2-3种辅助颜色
- 禁用色：不适合儿童的颜色
- 色彩情感：每种颜色的情感表达

【绘画风格标准】
- 线条风格：粗细、圆润度、连贯性
- 着色方式：平涂/渐变/纹理
- 阴影处理：阴影颜色、透明度、位置
- 高光效果：高光位置、强度、颜色

【输出格式要求】
请严格按照以下结构化格式输出，每个部分都要详细具体：

===== 人物一致性档案 =====
[角色名]
- 头部：发型[具体描述]，发色[色号]，眼睛[颜色+形状]，脸型[圆/方/尖]，肤色[具体色调]
- 服装：上衣[颜色+款式+图案]，下装[颜色+款式]，鞋子[颜色+样式]，配饰[具体描述]
- 表情：基本表情[开朗/文静等]，笑容[嘴角弧度]，眉毛[粗细+形状]
- 体态：身高[相对比例]，体型[瘦/胖/标准]，姿态[挺拔/放松等]

===== 物品一致性档案 =====
[物品名]
- 形状：[具体几何形状描述]
- 尺寸：[相对大小比例]
- 颜色：主色[具体颜色]，辅色[具体颜色]
- 材质：[木质/金属/布料等]，质感[光滑/粗糙/柔软]
- 细节：[装饰/图案/标识等具体特征]

===== 环境一致性档案 =====
[场景名]
- 布局：[空间结构和主要元素位置]
- 建筑：[墙面颜色]，[门窗样式]，[装饰元素]
- 地面：[材质和颜色]
- 背景：[远景元素描述]
- 光照：[光源方向和强度]

===== 色彩方案 =====
- 主色调：[颜色1][颜色2][颜色3]
- 辅助色：[颜色1][颜色2]
- 情感基调：[温暖/清新/活泼等]
- 饱和度：[高/中/低]

===== 绘画风格 =====
- 线条：[粗细程度]，[圆润度]
- 着色：[平涂/渐变/水彩等]
- 阴影：[颜色]，[透明度]
- 整体质感：[手绘/数字绘画/水彩等]

【重要提醒】
1. 所有描述必须具体到可以作为绘画指导
2. 颜色要用具体的色彩名称，不能用模糊词汇
3. 每个角色的特征描述要足够详细，确保不同画师都能画出一致的形象
4. 物品和环境的描述要包含足够的细节，避免前后不一致`
}

// 生成单页插图提示词（增强一致性版本）
export const generateSingleImagePrompt = (params: {
  pageType: 'cover' | 'content' | 'ending'
  pageIndex?: number
  content: string
  title: string
  coreElements: string
  previousImages?: string[] // 前面已生成图片的描述，用于参考一致性
}): string => {
  const { pageType, pageIndex, content, title, coreElements, previousImages } = params

  const pageTypeMap = {
    cover: {
      name: '封面',
      requirements: '需要包含故事标题，整体构图要吸引眼球，展现故事主题和主要角色',
      composition: '采用中心构图，主角居中，标题位置醒目，背景简洁但富有故事感'
    },
    content: {
      name: `第${pageIndex}页`,
      requirements: '准确表现当页情节，角色表情生动，场景细节丰富，与故事内容完美契合',
      composition: '根据故事情节选择最佳构图，突出关键动作和情感表达'
    },
    ending: {
      name: '结尾页',
      requirements: '营造温馨圆满的氛围，给读者满足感和幸福感，体现故事的完美结局',
      composition: '温馨的全景构图，展现故事的圆满结局，角色表情满足幸福'
    }
  }

  const currentPage = pageTypeMap[pageType]
  const previousImagesSection = previousImages && previousImages.length > 0 ?
    `【前序图片参考】
以下是已生成的图片描述，请确保新图片与之保持视觉一致性：
${previousImages.map((img, i) => `图片${i + 1}: ${img.substring(0, 100)}...`).join('\n')}

` : ''

  return `你是一位专业的儿童绘本插画师，正在为《${title}》创作${currentPage.name}插图。请严格遵循一致性标准，确保与整套绘本的视觉风格完全统一。

【当前任务】
- 页面类型：${currentPage.name}
- 故事内容：${content}
- 特殊要求：${currentPage.requirements}

【严格一致性标准】
${coreElements}

${previousImagesSection}【专业创作指导】
1. 角色一致性：严格按照人物档案描述角色的每一个细节，包括发型、服装、表情、体态
2. 物品一致性：所有重复出现的物品必须与档案描述完全一致
3. 环境一致性：场景布局、建筑风格、光照效果必须与档案标准统一
4. 色彩一致性：严格使用指定的色彩方案，不得随意更改主色调
5. 风格一致性：绘画技法、线条风格、质感表现必须与整套绘本统一

【构图要求】
- 基本构图：${currentPage.composition}
- 视角选择：采用儿童友好的视角，避免俯视或过于仰视
- 空间布局：合理安排前中后景，营造层次感
- 焦点设计：明确视觉焦点，引导读者注意力

【色彩与光影】
- 严格使用档案中指定的色彩方案
- 光源方向与强度保持一致
- 阴影颜色和透明度符合档案标准
- 整体色调温暖和谐，符合儿童审美

【细节要求】
- 角色表情要生动自然，符合故事情节
- 服装褶皱和质感要真实可信
- 背景细节丰富但不喧宾夺主
- 所有元素都要圆润安全，无尖锐边角

【质量标准】
- 分辨率：高清印刷品质
- 色彩饱和度：适中，不过于鲜艳
- 线条质量：流畅自然，粗细适宜
- 整体效果：专业绘本水准，适合3-6岁儿童

【输出要求】
请生成一段200-300字的详细插图描述，必须包含：
1. 角色描述（严格按照档案标准）
2. 环境场景（符合档案要求）
3. 构图布局（具体位置安排）
4. 色彩运用（使用指定色彩）
5. 情感氛围（契合故事内容）

【重要提醒】
- 绝对不能改变角色的基本外观特征
- 绝对不能改变重要物品的外观设计
- 绝对不能偏离指定的色彩方案
- 必须与前面的图片保持视觉连贯性`
}

export const generateImagePrompt = (params: ImagePromptParams & { coreElements?: string }): string => {
  const coreElementsSection = params.coreElements ?
    `【核心形象一致性标准】
${params.coreElements}

【一致性检查清单】
在描述每页插图时，必须确保：
✓ 角色外观与档案完全一致（发型、服装、表情、体态）
✓ 重要物品与档案描述完全匹配
✓ 场景环境符合档案标准
✓ 色彩方案严格遵循档案规定
✓ 绘画风格与整体保持统一

` : `【基础一致性要求】
${params.characters.map(char => {
      const features = char.analysis.split('，')
      return `${char.name}：${features.join('，')}（每页必须严格保持一致）`
    }).join('\n')}

`

  return `你是一位国际顶级的儿童绘本插画艺术家，拥有30年专业经验。请为《${params.title}》创作完整的插图描述方案，确保所有插图在视觉上完美统一。

【项目概况】
- 绘本标题：《${params.title}》
- 目标读者：3-6岁儿童
- 插图总数：${params.paragraphs.length + 2}张
- 艺术风格：${ILLUSTRATION_STYLES.watercolor.description}

${coreElementsSection}【故事分页内容】
${params.paragraphs.map((p, i) => `第${i + 1}页：${p}`).join('\n')}

【专业创作标准】
1. 视觉一致性：所有插图必须在角色、物品、环境、色彩、风格五个维度保持完全一致
2. 构图美学：${COMPOSITION_RULES.ruleOfThirds}，${COMPOSITION_RULES.childPerspective}
3. 色彩心理：运用${COLOR_PSYCHOLOGY.warm.emotion}的色彩组合，营造积极正面的情感体验
4. 叙事连贯：每页插图既要独立完整，又要与整体故事形成连贯的视觉叙事
5. 儿童友好：所有视觉元素都要符合儿童认知特点和审美偏好

【技术规格要求】
- 画面比例：适合绘本印刷的标准比例
- 分辨率：300DPI高清印刷品质
- 色彩模式：CMYK印刷色彩空间
- 安全边距：预留足够的装订和裁切边距

【创作流程指导】
1. 首先确认核心形象档案的每个细节
2. 为每页内容设计最佳构图方案
3. 确保角色在不同场景中的一致性表现
4. 统一整体色彩调性和光影效果
5. 检查所有细节的连贯性和专业性

【输出格式要求】
请按以下格式输出每页的详细插图描述（每页200-250字）：

封面插图：
[详细描述封面设计，包含标题排版、主角形象、背景环境、整体构图，严格遵循一致性标准]

第1页插图：
[详细描述第1页插图，准确对应故事内容，严格遵循角色和环境档案]

第2页插图：
[详细描述第2页插图，确保与前页保持视觉连贯性]

第3页插图：
[详细描述第3页插图，继续保持一致性标准]

第4页插图：
[详细描述第4页插图，注意情节发展的视觉表现]

第5页插图：
[详细描述第5页插图，准备故事高潮的视觉呈现]

结尾页插图：
[详细描述结尾页插图，营造温馨圆满的故事结局氛围]

【质量保证】
每页描述必须包含：角色外观、环境场景、构图布局、色彩运用、情感氛围五个维度的具体内容，确保描述足够详细，可以直接用于专业插画创作。`
}