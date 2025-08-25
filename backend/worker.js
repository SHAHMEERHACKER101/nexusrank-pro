/**
 * NexusRank Pro - Cloudflare Worker Backend
 * Securely connects frontend to DeepSeek API
 */

// CORS configuration
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://nexusrank-pro.pages.dev',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ];

  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return headers;
}

// DeepSeek API endpoint (NO TRAILING SPACE)
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Tool-specific configurations
const TOOL_CONFIGS = {
  'improve': {
    system: 'Improve this text for clarity, fluency, and professionalism.',
    max_tokens: 4000,
    temperature: 0.5
  },
  'seo-write': {
    system: 'Write a 5000-10000 word SEO-optimized article. Use H2/H3, bullet points, natural keywords, and human tone. Avoid AI patterns.',
    max_tokens: 16000,
    temperature: 0.7
  },
  'paraphrase': {
    system: 'Rewrite this text to be 100% unique and undetectable as AI. Use different sentence structures and synonyms.',
    max_tokens: 4000,
    temperature: 0.6
  },
  'humanize': {
    system: 'Make this sound 100% human. Add contractions, minor imperfections, and conversational flow. Undetectable as AI.',
    max_tokens: 4000,
    temperature: 0.8
  },
  'detect': {
    system: 'Analyze this text and estimate the probability it was AI-generated. Respond with: "AI Probability: X%" and a 2-sentence explanation.',
    max_tokens: 1000,
    temperature: 0.3
  },
  'grammar': {
    system: 'Fix all grammar, spelling, and punctuation errors. Return only the corrected text.',
    max_tokens: 4000,
    temperature: 0.2
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(request)
      });
    }

    // Health check
    if (path === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        status: 200,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    // Validate POST request
    if (request.method !== 'POST') {
      return createError(request, 'Method not allowed', 405);
    }

    // Define valid endpoints
    const validEndpoints = {
      '/ai/improve': 'improve',
      '/ai/seo-write': 'seo-write',
      '/ai/paraphrase': 'paraphrase',
      '/ai/humanize': 'humanize',
      '/ai/detect': 'detect',
      '/ai/grammar': 'grammar'
    };

    const tool = validEndpoints[path];
    if (!tool) {
      return createError(request, 'Endpoint not found', 404);
    }

    // Parse request body
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return createError(request, 'Invalid JSON', 400);
    }

    const text = data.text || data.prompt || '';
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return createError(request, 'Text input is required', 400);
    }

    // Get API key
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not set');
      return createError(request, 'AI service configuration error', 500);
    }

    // Get tool config
    const config = TOOL_CONFIGS[tool];
    if (!config) {
      return createError(request, 'Tool configuration not found', 500);
    }

    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: config.system },
            { role: 'user', content: text }
          ],
          max_tokens: config.max_tokens,
          temperature: config.temperature,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`DeepSeek API error: ${response.status} ${errorText}`);
        if (response.status === 401) {
          return createError(request, 'AI service authentication failed', 500);
        } else if (response.status === 429) {
          return createError(request, 'Rate limit exceeded', 429);
        } else {
          return createError(request, 'AI service unavailable', 503);
        }
      }

      const result = await response.json();
      const aiText = result.choices?.[0]?.message?.content?.trim();

      if (!aiText) {
        return createError(request, 'Empty response from AI', 500);
      }

      return new Response(JSON.stringify({
        success: true,
        result: aiText,
        tool: tool,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          ...getCorsHeaders(request),
          'Content-Type': 'application/json'
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return createError(request, 'Internal server error', 500);
    }
  }
};

// Unified error response
function createError(request, message, status) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json'
    }
  });
}
