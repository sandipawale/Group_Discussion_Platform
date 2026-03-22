require('dotenv').config();
const { generateGDTopic } = require('./services/topicService');

async function testTopicGen() {
    console.log('--- Testing Gemini GD Topic Generation ---');
    try {
        const result = await generateGDTopic();
        console.log('\n--- Result ---');
        console.log(JSON.stringify(result, null, 2));

        if (result.topic && result.description) {
            console.log('\n✅ Verification Successful!');
        } else {
            console.log('\n❌ Verification Failed: Missing topic or description');
        }
    } catch (err) {
        console.error('\n❌ Test Error:', err);
    }
}

testTopicGen();
