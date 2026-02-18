require('dotenv').config();
const videoService = require('./services/videoService');

try {
    console.log('--- ENV CHECK ---');
    console.log('AGORA_APP_ID from env:', process.env.AGORA_APP_ID);
    console.log('AGORA_APP_CERTIFICATE from env:', process.env.AGORA_APP_CERTIFICATE ? '***PRESENT***' : 'MISSING');

    console.log('\n--- TOKEN GENERATION ---');
    const result = videoService.getTestToken('test-channel', 1);
    console.log('Result AppID:', `"${result.appId}"`);
    console.log('Result Token:', result.token ? 'Generated' : 'Missing');
    console.log('Full Result:', JSON.stringify(result, null, 2));
} catch (e) {
    console.error('Error:', e);
}
