/**
 * NexusRank Pro - Cloudflare Worker with Google Gemini
 * Securely connects frontend to Gemini API
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

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return headers;
}

// Handle preflight (OPTIONS)
function handleOptions(request) {
  const corsHeaders = getCorsHeaders(request);
  corsHeaders['Access-Control-Allow-Headers'] = 'Content-Type';
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Gemini API URL
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Tool configurations with optimized prompts
const TOOL_CONFIGS = {
  'improve': {
    system: 'Improve this text for clarity, fluency, and professionalism. Keep it under 500 words.',
    max_tokens: 4000,
    temperature: 0.5
  },
  'seo-write': {
    system: 'Write a 5000-10000 word SEO-optimized article. Use H2/H3, bullet points, natural keywords, and human tone. Avoid AI patterns.',
    max_tokens: 16000,
    temperature: 0.7
  },
  'paraphrase': {
    system: 'Rewrite this text to be 100% unique and AI-undetectable. Use different sentence structures and synonyms.',
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
      return handleOptions(request);
    }

    // Validate POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: getCorsHeaders(request)
      });
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

    const text = data.text || '';
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text input is required' }), {
        status: 400,
        headers: getCorsHeaders(request)
      });
    }

    // Get Gemini API key
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set');
      return new Response(JSON.stringify({ error: 'AI service configuration error' }), {
        status: 500,
        headers: getCorsHeaders(request)
      });
    }

    // Get tool config
    const config = TOOL_CONFIGS[tool];
    if (!config) {
      return new Response(JSON.stringify({ error: 'Tool config not found' }), {
        status: 500,
        headers: getCorsHeaders(request)
      });
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${config.system}\n\n${text}` }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', errorText);
        return new Response(JSON.stringify({ error: 'AI service failed' }), {
          status: 503,
          headers: getCorsHeaders(request)
        });
      }

      const result = await response.json();
      const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!aiText) {
        return new Response(JSON.stringify({ error: 'Empty response from AI' }), {
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
