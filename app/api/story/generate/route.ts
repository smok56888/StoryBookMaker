import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage, generateStory } from '@/lib/arkApi'
import { generateStoryId, saveCharacterAnalysis, saveStory, saveStoryStatus } from '@/lib/storage'
import { USE_MOCK_DATA, ENABLE_DEBUG_LOGS } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    console.log('故事生成接口被调用')
    console.log('环境变量:', {
      ARK_BASE_URL: process.env.ARK_BASE_URL,
      ARK_API_KEY: process.env.ARK_API_KEY ? '***' : undefined,
      ARK_TEXT_TO_IMAGE_MODEL: process.env.ARK_TEXT_TO_IMAGE_MODEL,
      ARK_IMAGE_ANALYSIS_MODEL: process.env.ARK_IMAGE_ANALYSIS_MODEL
    })
    
    const body = await request.json()
    console.log('请求体:', JSON.stringify(body, null, 2))
    const { characters, outline, style, count = 5 } = body

    // 验证必要参数
    if (!characters || !Array.isArray(characters) || characters.length === 0) {
      return NextResponse.json(
        { error: '角色信息不能为空' },
        { status: 400 }
      )
    }

    if (!outline || outline.trim() === '') {
      return NextResponse.json(
        { error: '故事梗概不能为空' },
        { status: 400 }
      )
    }

    // 生成故事ID
    const storyId = generateStoryId()

    // 分析角色图片
    const analyzedCharacters = []
    for (const character of characters) {
      let analysis = ''
      
      if (character.image) {
        try {
          const result = await analyzeImage(character.image.replace(/^data:image\/[^;]+;base64,/, ''))
          if (result.success && result.data) {
            analysis = result.data.description
          }
        } catch (error) {
          console.error(`角色 ${character.name} 图片分析失败:`, error)
        }
      }

      analyzedCharacters.push({
        ...character,
        analysis
      })
    }

    // 保存角色分析结果
    saveCharacterAnalysis(storyId, analyzedCharacters)

    // 生成故事
    console.log('开始生成故事...')
    console.log('分析后的角色:', JSON.stringify(analyzedCharacters, null, 2))
    
    let storyResult;
    try {
      storyResult = await generateStory({
        characters: analyzedCharacters,
        outline,
        style: style || '温馨童真，富有教育意义',
        count
      });
      console.log('故事生成结果:', JSON.stringify(storyResult, null, 2));
    } catch (error) {
      console.error('故事生成API调用失败:', error);
      storyResult = { success: false, error: (error as Error).message || '故事生成API调用失败' };
    }

    if (!storyResult.success || !storyResult.data) {
      console.log('使用模拟数据生成故事')
      
      // 使用模拟数据
      const mockStoryData = {
        title: `${characters[0].name || '主角'}的奇妙冒险`,
        paragraphs: [
          `从前，在一个美丽的小村庄里，住着一个名叫${characters[0].name || '小主角'}的${characters[0].gender === 'female' ? '女孩' : '男孩'}。`,
          `${characters[0].name || '主角'}每天都会帮助村里的人们，给老奶奶送食物，帮小朋友找丢失的玩具，大家都很喜欢${characters[0].gender === 'female' ? '她' : '他'}。`,
          `有一天，村庄遇到了前所未有的困难，河水干涸了，庄稼开始枯萎，${characters[0].name || '主角'}决定去寻找解决的办法。`,
          `经过艰难的旅程，${characters[0].name || '主角'}穿越了茂密的森林，爬过了高山，终于找到了传说中的智慧老人。`,
          `智慧老人告诉${characters[0].gender === 'female' ? '她' : '他'}，只有真诚的心和无私的爱才能拯救村庄，并给了${characters[0].gender === 'female' ? '她' : '他'}一颗神奇的种子。`,
          `回到村庄后，${characters[0].name || '主角'}用自己的智慧和爱心种下了种子，奇迹般地，清泉涌出，村庄重新焕发生机。`,
          `从此，村庄变得更加美好，${characters[0].name || '主角'}也成为了大家心中的英雄，${characters[0].gender === 'female' ? '她' : '他'}的故事被传颂至今。`,
        ].slice(0, count)
      }
      
      storyResult = {
        success: true,
        data: mockStoryData
      }
    }

    // 保存故事内容
    if (storyResult.data) {
      saveStory(storyId, storyResult.data)
    }
    
    // 保存草稿状态
    saveStoryStatus(storyId, 'draft')

    return NextResponse.json({
      storyId,
      title: storyResult.data?.title || '',
      paragraphs: storyResult.data?.paragraphs || []
    })

  } catch (error: any) {
    console.error('故事生成接口错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}