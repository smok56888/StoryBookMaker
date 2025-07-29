// 测试优化后的提示词生成功能
const { generateImagePrompt } = require('./lib/arkApi');

async function testPromptOptimization() {
  console.log('开始测试优化后的提示词生成功能...\n');
  
  // 使用现有故事数据进行测试
  const testParams = {
    storyId: 'story_1753623615578_4cqc8hv1e',
    characters: [
      {
        name: '哈哈',
        analysis: '3岁女孩，活泼可爱，穿红色背心和蓝色裤子，喜欢跳舞，表情开朗，有着圆圆的脸蛋和明亮的眼睛'
      }
    ],
    paragraphs: [
      "小哈哈，爱跳舞。红背心，蓝裤子。妈妈送，去跳舞。踏踏踏，笑哈哈。",
      "舞蹈房，亮晶晶。小镜子，笑盈盈。老师好，弯弯腰。小脚尖，对齐啦。",
      "点点头，摇摇头。小手手，举高高。老师说，跟我做。哈哈学，不马虎。",
      "小脚尖，踮一踮。小膝盖，弯一弯。老师笑，拍拍手。哈哈乐，转圈圈。",
      "下课啦，再见啦。乖宝宝，顶呱呱。妈妈抱，笑哈哈。跳舞真，开心呀！"
    ],
    title: '哈哈跳舞啦！'
  };

  try {
    console.log('调用优化后的 generateImagePrompt 函数...');
    const result = await generateImagePrompt(testParams);
    
    if (result.success) {
      console.log('✅ 提示词生成成功！\n');
      
      console.log('📖 封面提示词:');
      console.log(result.data.cover);
      console.log('\n' + '='.repeat(50) + '\n');
      
      console.log('📄 内页提示词:');
      result.data.pages.forEach((page, index) => {
        console.log(`第${index + 1}页: ${page}`);
        console.log('');
      });
      
      console.log('='.repeat(50) + '\n');
      console.log('🎬 结尾页提示词:');
      console.log(result.data.ending);
      
      if (result.data.coreElements) {
        console.log('\n' + '='.repeat(50) + '\n');
        console.log('🎨 核心形象元素:');
        console.log(result.data.coreElements);
      }
      
    } else {
      console.log('❌ 提示词生成失败:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testPromptOptimization();