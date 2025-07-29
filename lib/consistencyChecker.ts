// 图片一致性检查器
// 用于验证生成的图片是否符合一致性标准

export interface ConsistencyStandard {
  characters: Array<{
    name: string
    appearance: {
      hair: string
      eyes: string
      face: string
      skin: string
      height: string
    }
    clothing: {
      top: string
      bottom: string
      shoes: string
      accessories: string
    }
    expression: {
      basic: string
      smile: string
      eyebrows: string
    }
  }>
  objects: Array<{
    name: string
    shape: string
    size: string
    color: string
    material: string
    details: string
  }>
  environments: Array<{
    name: string
    layout: string
    architecture: string
    ground: string
    background: string
    lighting: string
  }>
  colorScheme: {
    primary: string[]
    secondary: string[]
    mood: string
    saturation: string
  }
  artStyle: {
    lines: string
    coloring: string
    shadows: string
    texture: string
  }
}

export interface ConsistencyCheckResult {
  isConsistent: boolean
  score: number // 0-100
  issues: Array<{
    category: 'character' | 'object' | 'environment' | 'color' | 'style'
    severity: 'low' | 'medium' | 'high'
    description: string
    suggestion: string
  }>
  recommendations: string[]
}

// 解析核心形象元素为结构化数据
export function parseCoreElements(coreElementsText: string): ConsistencyStandard {
  const standard: ConsistencyStandard = {
    characters: [],
    objects: [],
    environments: [],
    colorScheme: {
      primary: [],
      secondary: [],
      mood: '',
      saturation: ''
    },
    artStyle: {
      lines: '',
      coloring: '',
      shadows: '',
      texture: ''
    }
  }

  try {
    // 解析人物档案
    const characterSection = coreElementsText.match(/===== 人物一致性档案 =====([\s\S]*?)=====/)?.[1]
    if (characterSection) {
      const characterBlocks = characterSection.split(/\n(?=[^\s-])/g).filter(block => block.trim())
      
      characterBlocks.forEach(block => {
        const lines = block.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          const name = lines[0].trim()
          const character = {
            name,
            appearance: { hair: '', eyes: '', face: '', skin: '', height: '' },
            clothing: { top: '', bottom: '', shoes: '', accessories: '' },
            expression: { basic: '', smile: '', eyebrows: '' }
          }
          
          lines.forEach(line => {
            if (line.includes('头部：')) {
              const headInfo = line.split('头部：')[1]
              character.appearance.hair = headInfo.match(/发型\[([^\]]+)\]/)?.[1] || ''
              character.appearance.eyes = headInfo.match(/眼睛\[([^\]]+)\]/)?.[1] || ''
              character.appearance.face = headInfo.match(/脸型\[([^\]]+)\]/)?.[1] || ''
              character.appearance.skin = headInfo.match(/肤色\[([^\]]+)\]/)?.[1] || ''
            }
            if (line.includes('服装：')) {
              const clothingInfo = line.split('服装：')[1]
              character.clothing.top = clothingInfo.match(/上衣\[([^\]]+)\]/)?.[1] || ''
              character.clothing.bottom = clothingInfo.match(/下装\[([^\]]+)\]/)?.[1] || ''
              character.clothing.shoes = clothingInfo.match(/鞋子\[([^\]]+)\]/)?.[1] || ''
            }
          })
          
          standard.characters.push(character)
        }
      })
    }

    // 解析物品档案
    const objectSection = coreElementsText.match(/===== 物品一致性档案 =====([\s\S]*?)=====/)?.[1]
    if (objectSection) {
      const objectBlocks = objectSection.split(/\n(?=[^\s-])/g).filter(block => block.trim())
      
      objectBlocks.forEach(block => {
        const lines = block.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          const name = lines[0].trim()
          const object = {
            name,
            shape: '',
            size: '',
            color: '',
            material: '',
            details: ''
          }
          
          lines.forEach(line => {
            if (line.includes('形状：')) object.shape = line.split('形状：')[1].trim()
            if (line.includes('颜色：')) object.color = line.split('颜色：')[1].trim()
            if (line.includes('材质：')) object.material = line.split('材质：')[1].trim()
          })
          
          standard.objects.push(object)
        }
      })
    }

    // 解析色彩方案
    const colorSection = coreElementsText.match(/===== 色彩方案 =====([\s\S]*?)=====/)?.[1]
    if (colorSection) {
      const primaryMatch = colorSection.match(/主色调：(.+)/)?.[1]
      if (primaryMatch) {
        standard.colorScheme.primary = primaryMatch.split(/[\[\]]+/).filter(c => c.trim())
      }
      
      const moodMatch = colorSection.match(/情感基调：(.+)/)?.[1]
      if (moodMatch) {
        standard.colorScheme.mood = moodMatch.trim()
      }
    }

  } catch (error) {
    console.warn('解析核心形象元素时出错:', error)
  }

  return standard
}

// 生成一致性检查提示词
export function generateConsistencyCheckPrompt(
  imageDescription: string,
  standard: ConsistencyStandard,
  pageType: string
): string {
  return `你是一位专业的绘本质量控制专家，请检查这个插图描述是否符合既定的一致性标准。

【待检查的插图描述】
${imageDescription}

【一致性标准】
人物标准：
${standard.characters.map(char => 
  `${char.name}: 发型${char.appearance.hair}, 眼睛${char.appearance.eyes}, 服装${char.clothing.top}+${char.clothing.bottom}`
).join('\n')}

物品标准：
${standard.objects.map(obj => 
  `${obj.name}: ${obj.shape}, ${obj.color}, ${obj.material}`
).join('\n')}

色彩标准：主色调${standard.colorScheme.primary.join('、')}, 情感${standard.colorScheme.mood}

【检查任务】
请检查插图描述是否在以下方面符合标准：
1. 角色外观是否与标准一致
2. 重要物品是否与标准匹配
3. 色彩运用是否符合方案
4. 整体风格是否统一

【输出格式】
一致性评分：[0-100分]
主要问题：[列出发现的不一致之处]
修改建议：[具体的改进建议]
符合度：[高/中/低]`
}

// 检查图片描述的一致性
export function checkImageConsistency(
  imageDescription: string,
  standard: ConsistencyStandard,
  pageType: string = 'content'
): ConsistencyCheckResult {
  const result: ConsistencyCheckResult = {
    isConsistent: true,
    score: 100,
    issues: [],
    recommendations: []
  }

  // 检查角色一致性
  standard.characters.forEach(character => {
    const charName = character.name
    if (imageDescription.includes(charName)) {
      // 检查发型
      if (character.appearance.hair && !imageDescription.includes(character.appearance.hair)) {
        result.issues.push({
          category: 'character',
          severity: 'high',
          description: `角色${charName}的发型描述与标准不符`,
          suggestion: `应该描述为：${character.appearance.hair}`
        })
        result.score -= 15
      }

      // 检查服装
      if (character.clothing.top && !imageDescription.includes(character.clothing.top)) {
        result.issues.push({
          category: 'character',
          severity: 'high',
          description: `角色${charName}的服装描述与标准不符`,
          suggestion: `应该描述为：${character.clothing.top}`
        })
        result.score -= 15
      }
    }
  })

  // 检查物品一致性
  standard.objects.forEach(object => {
    if (imageDescription.includes(object.name)) {
      if (object.color && !imageDescription.includes(object.color)) {
        result.issues.push({
          category: 'object',
          severity: 'medium',
          description: `物品${object.name}的颜色描述与标准不符`,
          suggestion: `应该描述为：${object.color}`
        })
        result.score -= 10
      }
    }
  })

  // 检查色彩方案
  const hasRequiredColors = standard.colorScheme.primary.some(color => 
    imageDescription.includes(color) || imageDescription.includes(color.toLowerCase())
  )
  if (!hasRequiredColors) {
    result.issues.push({
      category: 'color',
      severity: 'medium',
      description: '插图描述中缺少指定的主色调',
      suggestion: `应该包含以下颜色之一：${standard.colorScheme.primary.join('、')}`
    })
    result.score -= 10
  }

  // 生成建议
  if (result.issues.length > 0) {
    result.isConsistent = false
    result.recommendations.push('请根据一致性标准修改插图描述')
    result.recommendations.push('确保所有角色外观与档案完全一致')
    result.recommendations.push('检查重要物品的颜色和形状描述')
  }

  return result
}

// 生成优化后的图片描述
export function optimizeImageDescription(
  originalDescription: string,
  standard: ConsistencyStandard,
  consistencyCheck: ConsistencyCheckResult
): string {
  if (consistencyCheck.isConsistent) {
    return originalDescription
  }

  let optimizedDescription = originalDescription

  // 根据检查结果进行优化
  consistencyCheck.issues.forEach(issue => {
    if (issue.category === 'character' && issue.suggestion) {
      // 这里可以实现更智能的文本替换逻辑
      // 目前先返回原描述加上建议
    }
  })

  return optimizedDescription
}