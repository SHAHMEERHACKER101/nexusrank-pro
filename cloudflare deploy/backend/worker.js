// Cloudflare Worker for NexusRank Pro
// Production-ready DeepSeek API integration

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://nexusrank-pro.pages.dev',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

class DeepSeekProvider {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.deepseek.com/v1/chat/completions';
    }

    async callAPI(messages, temperature = 0.7) {
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: temperature,
                max_tokens: 8000
            }),
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async improveText(text) {
        const prompt = "Enhance this text for clarity, fluency, and professionalism. Improve readability, fix awkward phrasing, and optimize for engagement — without changing the core message.";
        
        return await this.callAPI([
            {
                role: 'system',
                content: prompt
            },
            {
                role: 'user',
                content: text
            }
        ], 0.6);
    }

    async generateSEOContent(prompt, length = 'long') {
        const wordTarget = {
            'short': '1000-2000',
            'medium': '3000-5000', 
            'long': '5000-10000'
        }[length] || '5000-10000';

        const systemPrompt = "You are a top-tier SEO content writer with 10+ years of experience. Write a comprehensive, engaging, and highly readable article on the given topic. Use natural keyword integration, H2/H3 structure, bullet points, and real insights. Sound human — use contractions, varied sentences, and subtle opinions. Do not use AI patterns.";
        
        return await this.callAPI([
            {
                role: 'system',
                content: systemPrompt
            },
            {
                role: 'user',
                content: `Write a ${wordTarget} word article about: ${prompt}`
            }
        ], 0.8);
    }

    async paraphraseText(text, style = 'standard') {
        const stylePrompts = {
            'standard': 'Rewrite this text to be 100% unique and undetectable as AI. Use different sentence structures, synonyms, and natural flow. Keep the original meaning but make it sound fresh and human.',
            'creative': 'Rewrite this text in a more creative, engaging, and dynamic style while maintaining the core message.',
            'academic': 'Rewrite this text in formal academic language with proper scholarly tone and structure.',
            'simple': 'Rewrite this text in simple, clear language that anyone can understand.'
        };

        return await this.callAPI([
            {
                role: 'system',
                content: stylePrompts[style] || stylePrompts.standard
            },
            {
                role: 'user',
                content: text
            }
        ], 0.7);
    }

    async humanizeText(text) {
        const prompt = "Transform this AI-generated text to sound 100% human. Add minor imperfections, contractions, personal tone, and conversational flow. Avoid formal phrases like 'furthermore' or 'it is important to note'. Make it undetectable as AI.";
        
        return await this.callAPI([
            {
                role: 'system',
                content: prompt
            },
            {
                role: 'user',
                content: text
            }
        ], 0.8);
    }

    async detectAI(text) {
        const prompt = "Analyze this text and estimate the probability it was AI-generated. Respond with: 'AI Probability: X%' and a 2-sentence explanation based on repetition, tone, structure, and language patterns.";
        
        return await this.callAPI([
            {
                role: 'system',
                content: prompt
            },
            {
                role: 'user',
                content: text
            }
        ], 0.3);
    }

    async fixGrammar(text) {
        const prompt = "Fix all grammar, spelling, punctuation, and style errors in this text. Return only the corrected version — no explanations.";
        
        return await this.callAPI([
            {
                role: 'system',
                content: prompt
            },
            {
                role: 'user',
                content: text
            }
        ], 0.5);
    }
}

export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: CORS_HEADERS
            });
        }

        // Only allow POST requests
        if (request.method !== 'POST') {
            return new Response('Method not allowed', {
                status: 405,
                headers: CORS_HEADERS
            });
        }

        try {
            const url = new URL(request.url);
            const path = url.pathname;
            
            if (!env.DEEPSEEK_API_KEY) {
                throw new Error('DeepSeek API key not configured');
            }

            const deepSeek = new DeepSeekProvider(env.DEEPSEEK_API_KEY);
            const body = await request.json();
            let result;

            switch (path) {
                case '/ai/improve':
                    result = await deepSeek.improveText(body.text);
                    break;
                
                case '/ai/seo-write':
                    result = await deepSeek.generateSEOContent(body.prompt, body.length);
                    break;
                
                case '/ai/paraphrase':
                    result = await deepSeek.paraphraseText(body.text, body.style);
                    break;
                
                case '/ai/humanize':
                    result = await deepSeek.humanizeText(body.text);
                    break;
                
                case '/ai/detect':
                    result = await deepSeek.detectAI(body.text);
                    break;
                
                case '/ai/grammar':
                    result = await deepSeek.fixGrammar(body.text);
                    break;
                
                default:
                    return new Response('Endpoint not found', {
                        status: 404,
                        headers: CORS_HEADERS
                    });
            }

            return new Response(JSON.stringify({
                success: true,
                content: result
            }), {
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'application/json'
                }
            });

        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: error.message
            }), {
                status: 500,
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'application/json'
                }
            });
        }
    }
};