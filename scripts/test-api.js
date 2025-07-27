// 测试豆包API连接
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const ARK_BASE_URL = process.env.ARK_BASE_URL;
const ARK_API_KEY = process.env.ARK_API_KEY;
const ARK_IMAGE_ANALYSIS_MODEL = process.env.ARK_IMAGE_ANALYSIS_MODEL;

async function testApi() {
  try {
    console.log('测试豆包API连接...');
    console.log(`API基础URL: ${ARK_BASE_URL}`);
    console.log(`API Key: ${ARK_API_KEY.substring(0, 5)}...${ARK_API_KEY.substring(ARK_API_KEY.length - 5)}`);
    console.log(`模型ID: ${ARK_IMAGE_ANALYSIS_MODEL}`);

    const response = await axios.post(
      `${ARK_BASE_URL}/chat/completions`,
      {
        model: ARK_IMAGE_ANALYSIS_MODEL,
        messages: [
          {
            role: 'user',
            content: '你好，请简单介绍一下你自己。'
          }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${ARK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('API连接成功!');
    console.log('响应数据:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('API连接失败:');
    console.error(error.response?.data || error.message);
  }
}

testApi();