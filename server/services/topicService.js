const https = require('https');

const TOPIC_CATEGORIES = [
    'Artificial Intelligence & Machine Learning',
    'Cybersecurity & Data Privacy',
    'Cloud Computing & DevOps',
    'Blockchain & Web3',
    'Remote Work & Future of Employment',
    'Green Technology & Sustainability',
    'Social Media & Mental Health',
    'Automation & Job Displacement',
    'Ethics in Technology',
    'Startup Culture & Entrepreneurship',
    'EdTech & Online Education',
    'HealthTech & Telemedicine',
    'Electric Vehicles & Smart Cities',
    'Open Source vs Proprietary Software',
    'Digital Privacy & Surveillance',
    'Gig Economy & Worker Rights',
    'Space Technology & Commercialization',
    'Quantum Computing',
    'Fintech & Digital Payments',
    'Gaming & Metaverse',
];

const FALLBACK_TOPICS = [
    { topic: 'Should AI Systems Be Given Legal Personhood?', description: 'As AI becomes more autonomous, should it have legal rights and responsibilities? Discuss the ethical, legal, and societal implications of AI personhood.' },
    { topic: 'Is Remote Work Killing Workplace Culture?', description: 'Remote work offers flexibility but may erode team cohesion. Debate the long-term impact on productivity, mentorship, and company culture.' },
    { topic: 'Can Open Source Software Replace Proprietary Giants?', description: 'Open source has powered the internet, but can it fully displace proprietary software in enterprise? Explore sustainability, security, and innovation trade-offs.' },
    { topic: 'Should Social Media Platforms Be Regulated Like Utilities?', description: 'Social media controls public discourse at scale. Should governments regulate it like a public utility to ensure fairness, prevent censorship, and encourage innovation?' },
    { topic: 'Is the Gig Economy Exploitation or Empowerment?', description: 'Platforms like Uber and Fiverr offer flexibility but lack job security. Is this the future of work or a step backward for labor rights?' },
    { topic: 'Should Coding Be Mandatory in School Curriculum?', description: 'As software eats the world, should programming replace traditional subjects? Debate its impact on creativity, critical thinking, and career readiness.' },
    { topic: 'Is Cryptocurrency a Currency or a Speculative Asset?', description: 'Bitcoin and Ethereum promise financial decentralization, but volatility undermines their use as currency. Are they an investment tool or a flawed monetary system?' },
    { topic: 'Should Tech Companies Pay a Digital Services Tax?', description: 'Big tech profits globally but pays minimal tax in many countries. Should nations impose a digital services tax, and how would it affect innovation?' },
    { topic: 'Are Electric Vehicles Truly Green or Just Greenwashing?', description: 'EVs eliminate tailpipe emissions but depend on lithium mining and coal-powered grids. Is the EV revolution genuinely sustainable or just shifting the pollution problem?' },
    { topic: 'Should Governments Ban TikTok on National Security Grounds?', description: 'Multiple governments have restricted TikTok citing data privacy risks. Is the ban justified security policy or economic protectionism disguised as regulation?' },
    { topic: 'Is Generative AI a Threat to Creative Professions?', description: 'AI tools like DALL-E and ChatGPT can produce art, music, and writing. Should creative professionals fear displacement, or will AI expand creative opportunities?' },
    { topic: 'Should There Be a Universal Basic Income in the AI Era?', description: 'As automation displaces jobs, some propose UBI as a safety net. Debate its economic feasibility, social impact, and whether it discourages workforce participation.' },
    { topic: 'Is Cloud Computing Creating Dangerous Vendor Lock-in?', description: 'Businesses increasingly depend on AWS, Azure, and GCP. Does this concentration of infrastructure create critical vulnerabilities, or are competitive benefits worth the risk?' },
    { topic: 'Should Deepfake Technology Be Completely Banned?', description: 'Deepfakes enable misinformation, non-consensual content, and fraud. Should the technology itself be banned, or should we focus on regulation and detection tools?' },
    { topic: 'Is Agile Development Overrated in Modern Software Teams?', description: 'Agile promised flexibility and faster delivery, but many teams suffer from "Agile theater." Has the methodology lived up to its promise, or become bureaucracy in disguise?' },
    { topic: 'Should Autonomous Weapons Be Banned Under International Law?', description: 'AI-powered weapons can make lethal decisions without human input. Should the world ban autonomous weapons systems before they redefine warfare irreversibly?' },
    { topic: 'Is the Metaverse the Future of Work or an Expensive Failure?', description: 'Meta and Microsoft invested billions in virtual workplaces. Is the metaverse a transformative shift in how humans collaborate, or a costly distraction from real needs?' },
    { topic: 'Should Data Privacy Be a Fundamental Human Right?', description: 'Personal data drives trillion-dollar platforms but users have little control over it. Should privacy be codified as a universal right, overriding commercial data interests?' },
    { topic: 'Is India Ready to Become a Global AI Superpower?', description: 'India has talent, data, and ambition for AI leadership, but faces infrastructure and compute gaps. Can India realistically compete with the US and China in the AI race?' },
    { topic: 'Should Tech Layoffs Be Regulated by Government Policy?', description: 'Mass layoffs at tech giants left thousands jobless overnight. Should governments enforce notice periods, severance mandates, or retraining obligations on large tech employers?' },
    { topic: 'Is Quantum Computing an Existential Threat to Cybersecurity?', description: 'Quantum computers could break current encryption standards, threatening banking, defense, and communications. How urgently must industries migrate to post-quantum cryptography?' },
    { topic: 'Should Internet Access Be Declared a Basic Human Right?', description: 'Billions remain offline, excluded from education, healthcare, and economic opportunity. Should reliable internet access be treated as a fundamental right like clean water?' },
    { topic: 'Are Coding Bootcamps a Viable Alternative to CS Degrees?', description: 'Bootcamps promise job-ready skills in months versus four-year degrees. Do they produce engineers capable of solving complex problems, or just entry-level coders?' },
    { topic: 'Should AI-Generated Content Be Labeled and Watermarked?', description: 'As AI content floods the web, readers cannot distinguish human from machine-generated text. Should mandatory labeling be enforced, and who bears the responsibility?' },
    { topic: "Is Big Tech's Dominance Harmful to Innovation?", description: 'Google, Apple, Meta, and Amazon control key platforms and distribution. Does their dominance stifle startups, or do their ecosystems actually enable broader innovation?' },
    { topic: 'Should Facial Recognition Technology Be Banned in Public Spaces?', description: 'Law enforcement uses facial recognition for security, but it raises serious civil liberties concerns. Should its use be banned, strictly regulated, or freely permitted?' },
    { topic: "Is the IT Industry's Crunch Culture Unsustainable?", description: 'Long hours and burnout are endemic in software development. Should the industry adopt stricter work-hour regulations, or is crunch an unavoidable part of shipping products?' },
    { topic: 'Should Space Exploration Be Led by Private Companies?', description: 'SpaceX and Blue Origin are outpacing national space agencies. Should space exploration be privatized for speed and efficiency, or kept as a public, government-led endeavor?' },
    { topic: 'Is Zero-Trust Security the New Standard for Enterprise IT?', description: 'Traditional perimeter security has failed repeatedly against modern threats. Should zero-trust architecture become the mandatory baseline for all enterprise systems?' },
    { topic: 'Should Employees Have the Right to Disconnect From Work Tech?', description: 'Always-on messaging apps blur work-life boundaries. Should workers have a legally protected right to disconnect from work technology outside office hours?' },
];

const FREE_MODELS = [
    'google/gemma-4-31b-it:free',
    'google/gemma-4-26b-a4b-it:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
];

function callOpenRouter(prompt, model) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 1.2,
        });

        const req = https.request({
            hostname: 'openrouter.ai',
            path: '/api/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) return reject(new Error(json.error.message));
                    resolve(json.choices[0].message.content);
                } catch (e) {
                    reject(new Error('Failed to parse OpenRouter response'));
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('OpenRouter request timed out')); });
        req.write(body);
        req.end();
    });
}

async function generateGDTopic(usedTopics = []) {
    const category = TOPIC_CATEGORIES[Math.floor(Math.random() * TOPIC_CATEGORIES.length)];
    const seed = Date.now();

    console.log(`🔮 Generating unique GD topic [category: ${category}] [seed: ${seed}]`);

    try {
        const avoidSection = usedTopics.length > 0
            ? `\nDo NOT generate any of these already-used topics or close variations:\n${usedTopics.map(t => `- ${t}`).join('\n')}\n`
            : '';

        const prompt = `You are an expert placement trainer at a top engineering college in India. Your job is to generate HOT, TRENDING Group Discussion (GD) topics for CS/IT engineering students preparing for campus placements at companies like TCS, Infosys, Wipro, Accenture, Google, Microsoft, Amazon, and startups.

These students are in their final year of B.E./B.Tech (CS/IT). The GD round is part of their placement interview process. Topics must feel REAL, CURRENT, and RELEVANT to what tech recruiters actually ask in 2024-2025.

Focus area this session: "${category}"
Session seed (use this to vary output every time): ${seed}
Timestamp: ${new Date().toISOString()}
${avoidSection}
Topic requirements:
1. HOT and TRENDING — based on something happening in tech/society RIGHT NOW in 2024-2025
2. RELEVANT to CS/IT students — connects to their career, industry, or tech skills
3. DEBATABLE — must have strong arguments on BOTH sides, no obvious right answer
4. NOT generic — avoid overused titles like "Future of AI", "Is Technology Good or Bad", "Future of Engineering"
5. Placement-focused — the kind of topic that actually appears in TCS, Infosys, Wipro, Cognizant, or product company GD rounds
6. Title: punchy, specific, under 12 words
7. Description: 2-3 sentences covering what the topic is about and what two sides students should argue

Good examples of the style:
- "Should IT Companies Mandate Return-to-Office After COVID?"
- "Is India's IT Sector Losing Edge to AI Automation?"
- "Should Engineering Colleges Replace Degrees With Skill Certifications?"
- "Are Mass Tech Layoffs a Sign of Industry Maturity or Crisis?"

Respond ONLY with valid JSON — no markdown, no code fences, no extra text:
{"topic": "The GD Topic Title Here", "description": "2-3 sentence explanation of the debate."}`;

        let responseText;
        for (const model of FREE_MODELS) {
            try {
                responseText = await callOpenRouter(prompt, model);
                console.log(`📡 Used model: ${model}`);
                break;
            } catch (modelErr) {
                console.warn(`⚠️ Model ${model} failed: ${modelErr.message} — trying next`);
            }
        }
        if (!responseText) throw new Error('All OpenRouter models failed');

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            if (data.topic && data.description) {
                console.log(`✅ Generated Topic: ${data.topic}`);
                return { topic: data.topic.trim(), description: data.description.trim() };
            }
        }

        throw new Error('Invalid JSON structure from AI response');
    } catch (err) {
        console.error('❌ Failed to generate GD topic via OpenRouter:', err.message);

        const unused = FALLBACK_TOPICS.filter(t => !usedTopics.includes(t.topic));
        const pool = unused.length > 0 ? unused : FALLBACK_TOPICS;
        const idx = Math.floor(Date.now() / 1000) % pool.length;
        return pool[idx];
    }
}

module.exports = { generateGDTopic };
