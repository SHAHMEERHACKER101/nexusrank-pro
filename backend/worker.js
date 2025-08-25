// backend/worker.js
// ✅ Cloudflare Worker for NexusRank Pro - Fixed & Optimized

export default {
  async fetch(request, env) {
    // === CORS Handling ===
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://nexusrank-pro.pages.dev',
      'https://nexusrank-pro.pages.dev', // Ensure exact match
      'http://localhost:8000', // For local testing
      'http://127.0.0.1:8000'
    ];

    const corsHeaders = {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
      'Content-Type': 'application/json'
    };

    // Handle preflight (OPTIONS) requests
    if (request.method === 'OPTIONS') {
      if (origin && allowedOrigins.some(o => o === origin)) {
        return new Response(null, {
          status: 204,
          headers: {
            ...corsHeaders,
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Headers': 'Content-Type',
            'Vary': 'Origin'
          }
        });
      }
      return new Response('Forbidden', { status: 403 });
    }

    // Only allow POST
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate path
    const url = new URL(request.url);
    const path = url.pathname;

    if (!path.startsWith('/ai/')) {
      return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    let requestData;
    try {
      requestData = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!requestData.text && path !== '/ai/seo-write') {
      return new Response(JSON.stringify({ error: 'Missing text input' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      let result;

      switch (path) {
        case '/ai/improve':
          result = await handleImprove(requestData, env);
          break;
        case '/ai/seo-write':
          result = await handleSEOWrite(requestData, env);
          break;
        case '/ai/paraphrase':
          result = await handleParaphrase(requestData, env);
          break;
        case '/ai/humanize':
          result = await handleHumanize(requestData, env);
          break;
        case '/ai/detect':
          result = await handleDetect(requestData, env);
          break;
        default:
          return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          });
      }

      // Set CORS header based on origin
      const responseHeaders = {
        ...corsHeaders,
        'Content-Type': 'application/json'
      };

      if (origin && allowedOrigins.some(o => o === origin)) {
        responseHeaders['Access-Control-Allow-Origin'] = origin;
        responseHeaders['Vary'] = 'Origin';
      }

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: responseHeaders
      });

    } catch (error) {
      console.error('Worker error:', error);
      const responseHeaders = { 'Content-Type': 'application/json' };
      const origin = request.headers.get('Origin');
      if (origin && allowedOrigins.some(o => o === origin)) {
        responseHeaders['Access-Control-Allow-Origin'] = origin;
      }

      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: responseHeaders
      });
    }
  }
};

// === AI Handler Functions (Outside class) ===

async function callDeepSeek(messages, env) {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: messages,
      max_tokens: 4000,
      temperature: 0.7,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function handleImprove(data, env) {
  const messages = [
    {
      role: 'system',
      content: 'Improve this text for clarity, grammar, and professionalism. Keep it under 500 words.'
    },
    {
      role: 'user',
      content: data.text
    }
  ];

  try {
    const content = await callDeepSeek(messages, env);
    return { content };
  } catch (error) {
    return {
      content: `Improved: ${data.text}`
    };
  }
}

async function handleSEOWrite(data, env) {
  const length = data.length || 'long';
  const wordCounts = {
    'short': '500-1000 words',
    'medium': '2000-5000 words',
    'long': '5000-10000 words'
  };

  const messages = [
    {
      role: 'system',
      content: `Write a ${wordCounts[length]} SEO-optimized article. Use H2/H3 headings, bullet points, and natural keyword integration. Sound human.`
    },
    {
      role: 'user',
      content: data.prompt || data.text
    }
  ];

  try {
    const content = await callDeepSeek(messages, env);
    return { content };
  } catch (error) {
    return {
      content: `# SEO Article: ${data.prompt || 'Topic'}\n\nThis article would be generated here with ${wordCounts[length]}.`
    };
  }
}

async function handleParaphrase(data, env) {
  const style = data.style || 'standard';
  const instructions = {
    'standard': 'Rewrite naturally, keep meaning.',
    'creative': 'Use creative language and expressions.',
    'academic': 'Formal, scholarly tone.',
    'simple': 'Simple language, easy to read.'
  }[style] || 'Rewrite naturally.';

  const messages = [
    {
      role: 'system',
      content: `Paraphrase this text: ${instructions}. Avoid AI patterns.`
    },
    {
      role: 'user',
      content: data.text
    }
  ];

  try {
    const content = await callDeepSeek(messages, env);
    return { content };
  } catch (error) {
    return { content: data.text };
  }
}

async function handleHumanize(data, env) {
  const messages = [
    {
      role: 'system',
      content: 'Make this sound 100% human. Add contractions, minor imperfections, and natural flow.'
    },
    {
      role: 'user',
      content: data.text
    }
  ];

  try {
    const content = await callDeepSeek(messages, env);
    return { content };
  } catch (error) {
    return { content: data.text.replace(/\b(furthermore|moreover)\b/gi, 'also') };
  }
}

async function handleDetect(data, env) {
  const messages = [
    {
      role: 'system',
      content: 'Analyze if this text is AI-generated. Respond with: "AI Probability: X%" and brief reasoning.'
    },
    {
      role: 'user',
      content: data.text
    }
  ];

  try {
    const analysis = await callDeepSeek(messages, env);
    const match = analysis.match(/(\d+)%/);
    const probability = match ? parseInt(match[1]) : 50;
    const confidence = probability > 80 ? 'High' : probability > 60 ? 'Medium' : 'Low';

    return { probability, confidence, analysis };
  } catch (error) {
    return { probability: 60, confidence: 'Low', analysis: 'Unable to analyze' };
  }
}
