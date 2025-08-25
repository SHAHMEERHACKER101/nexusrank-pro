/**
 * NexusRank Pro - Fixed Cloudflare Worker
 * Resolves CORS issues and allows Content-Type header
 */

// Allowed origins (NO TRAILING SPACES!)
const ALLOWED_ORIGINS = [
  'https://nexusrank-pro.pages.dev',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];

// CORS headers
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');

  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };

  // Only allow known origins
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin'; // Critical for caching
  }

  return headers;
}

// Handle preflight (OPTIONS) requests
function handleOptions(request) {
  const corsHeaders = getCorsHeaders(request);

  // Add Access-Control-Allow-Headers for preflight
  corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type';

  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// DeepSeek API URL (NO TRAILING SPACE!)
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Tool configurations
const TOOL_CONFIGS = {
  'improve': {
    system: 'Improve this text for clarity and fluency.',
    max_tokens: 4000,
    temperature: 0.5
  },
  'seo-write': {
    system: 'Write a 5000-10000 word SEO-optimized article. Use H2/H3, keywords, and human tone.',
    max_tokens: 16000,
    temperature: 0.7
  },
  'paraphrase': {
    system: 'Rewrite to be 100% unique and AI-undetectable.',
    max_tokens: 4000,
    temperature: 0.6
  },
  'humanize': {
    system: 'Make this sound 100% human. Add contractions, imperfections, and natural flow.',
    max_tokens: 4000,
    temperature: 0.8
  },
  'detect': {
    system: 'Estimate AI probability. Respond with: "AI Probability: X%" and brief reasoning.',
    max_tokens: 1000,
    temperature: 0.3
  },
  'grammar': {
    system: 'Fix all grammar, spelling, and punctuation errors.',
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
      return handleOptions(request);
    }

    // Health check
    if (path === '/health' && request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        status: 200,
        headers: { ...getCorsHeaders(request), 'Content-Type': 'application/json' }
      });
    }

    // Validate POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: getCorsHeaders(request)
      });
    }

    // Define valid AI endpoints
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
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: getCorsHeaders(request)
      });
    }

    // Parse request body
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: getCorsHeaders(request)
      });
    }

    const text = data.text || data.prompt || '';
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text input is required' }), {
        status: 400,
        headers: getCorsHeaders(request)
      });
    }

    // Get API key
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY not set');
      return new Response(JSON.stringify({ error: 'AI service configuration error' }), {
        status: 500,
        headers: getCorsHeaders(request)
      });
    }

    const config = TOOL_CONFIGS[tool];
    if (!config) {
      return new Response(JSON.stringify({ error: 'Tool config not found' }), {
        status: 500,
        headers: getCorsHeaders(request)
      });
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
          temperature: config.temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek error:', response.status, errorText);
        return new Response(JSON.stringify({ error: 'AI service error' }), {
          status: 503,
          headers: getCorsHeaders(request)
        });
      }

      const result = await response.json();
      const aiText = result.choices?.[0]?.message?.content?.trim();

      if (!aiText) {
        return new Response(JSON.stringify({ error: 'Empty AI response' }), {
          status: 500,
          headers: getCorsHeaders(request)
        });
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
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: getCorsHeaders(request)
      });
    }
  }
};
