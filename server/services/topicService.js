const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates a dynamic GD topic and description using Gemini 1.5 Flash.
 * Focuses on hot topics for IT Engineering placements.
 */
async function generateGDTopic() {
    console.log('🔮 Generating dynamic GD topic from Gemini...');

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_HARASSMENT',
                    threshold: 'BLOCK_NONE'
                },
                {
                    category: 'HARM_CATEGORY_HATE_SPEECH',
                    threshold: 'BLOCK_NONE'
                },
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_NONE'
                },
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_NONE'
                }
            ]
        });

        const prompt = `Generate a trending and professional Group Discussion (GD) topic for IT Engineering campus placements. 
Focus on hot topics in the current tech landscape (e.g., AI ethics, remote work, cybersecurity, automation).

Respond ONLY with valid JSON:
{
    "topic": "The Title of the GD Topic",
    "description": "A brief 2-3 sentence overview."
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.topic && data.description) {
                console.log(`✅ Generated Topic: ${data.topic}`);
                return data;
            }
        }

        throw new Error('Invalid JSON structure from Gemini');

    } catch (err) {
        console.error('❌ Failed to generate GD topic:', err.message);
        // Fallback topic if Gemini fails
        return {
            topic: "The Future of Artificial Intelligence in Engineering",
            description: "Discuss how AI is reshaping traditional engineering roles and the ethical considerations that come with its rapid adoption."
        };
    }
}

module.exports = { generateGDTopic };
