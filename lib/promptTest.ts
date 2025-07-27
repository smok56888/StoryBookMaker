// 提示词测试文件
// 用于测试和验证优化后的提示词效果

import { generateStoryPrompt, generateImagePrompt } from './promptTemplates'

// 测试故事生成提示词
const testStoryPrompt = () => {
  const testParams = {
    characters: [
      {
        name: '小兔子',
        age: '4',
        gender: 'female' as const,
        analysis: '活泼可爱，喜欢蹦蹦跳跳，有一双长长的耳朵，穿着粉色的小裙子'
      },
      {
        name: '小熊',
        age: '5',
        gender: 'male' as const,
        analysis: '憨厚善良，喜欢帮助别人，有着棕色的毛发，总是笑眯眯的'
      }
    ],
    outline: '小兔子和小熊一起去森林里寻找丢失的彩虹，在路上遇到了各种困难，最终通过友谊和勇气找到了彩虹',
    style: '友谊成长',
    count: 5
  }

  const prompt = generateStoryPrompt(testParams)
  console.log('=== 故事生成提示词测试 ===')
  console.log(prompt)
  console.log('\n')
}

// 测试图片提示词生成
const testImagePrompt = () => {
  const testParams = {
    storyId: 'test_story_001',
    characters: [
      {
        name: '小兔子',
        analysis: '活泼可爱的小兔子，有一双长长的耳朵，穿着粉色的小裙子，眼睛大大的很有神'
      },
      {
        name: '小熊',
        analysis: '憨厚善良的小熊，有着棕色的毛发，总是笑眯眯的，穿着蓝色的背带裤'
      }
    ],
    paragraphs: [
      '在一个阳光明媚的早晨，小兔子发现天空中的彩虹不见了，她决定去寻找彩虹。',
      '小兔子遇到了小熊，小熊决定和她一起去寻找彩虹，他们手拉手走进了森林。',
      '在森林里，他们遇到了一条小河，河水很深，他们不知道怎么过河。',
      '小熊想到了一个好办法，他们找来了一根长长的木头，搭成了一座小桥。',
      '终于，他们在森林深处找到了彩虹，原来彩虹在和小动物们一起玩捉迷藏呢！'
    ],
    title: '寻找彩虹的冒险'
  }

  const prompt = generateImagePrompt(testParams)
  console.log('=== 图片提示词生成测试 ===')
  console.log(prompt)
  console.log('\n')
}

// 运行测试
if (require.main === module) {
  testStoryPrompt()
  testImagePrompt()
}

export { testStoryPrompt, testImagePrompt }