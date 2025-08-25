/**
 * NexusRank Pro - Cloudflare Worker Backend
 * Handles AI processing requests with DeepSeek API integration
 */

// CORS headers for frontend access
function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = [
    'https://nexusrank-pro.pages.dev',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'https://nexusrank-pro.pages.dev',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

// DeepSeek API configuration
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Main request handler - Module Worker Format
 */
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

/**
 * Handle incoming requests
 */
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getCorsHeaders(request),
    });
  }

  // Health check endpoint
  if (path === '/health' && request.method === 'GET') {
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }), {
      status: 200,
      headers: {
        ...getCorsHeaders(request),
        'Content-Type': 'application/json',
      },
    });
  }

  // AI processing endpoints
  const aiEndpoints = {
    '/ai/improve': 'improve',
    '/ai/seo-write': 'seo-write', 
    '/ai/paraphrase': 'paraphrase',
    '/ai/humanize': 'humanize',
    '/ai/detect': 'detect',
    '/ai/grammar': 'grammar'
  };

  if (aiEndpoints[path] && request.method === 'POST') {
    return await handleAIRequest(request, aiEndpoints[path], env);
  }

  // Handle 404 for unknown routes
  return new Response(JSON.stringify({
    success: false,
    error: 'Endpoint not found'
  }), {
    status: 404,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Handle AI processing requests
 */
async function handleAIRequest(request, tool, env) {
  try {
    // Parse request body
    const body = await request.json();
    const { text, prompt } = body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return createErrorResponse(request, 'Text input is required and cannot be empty', 400);
    }

    if (!prompt || typeof prompt !== 'string') {
      return createErrorResponse(request, 'Prompt is required', 400);
    }

    // Get API key from environment
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      console.error('DEEPSEEK_API_KEY environment variable not set');
      return createErrorResponse(request, 'AI service configuration error', 500);
    }

    // Create the full prompt for DeepSeek
    const fullPrompt = `${prompt}\n\nText to process:\n${text}`;

    // Make request to DeepSeek API
    const deepseekResponse = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional AI assistant specializing in content creation and optimization. Provide high-quality, human-like responses that meet the specific requirements given in the user prompt.'
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        max_tokens: getMaxTokensForTool(tool),
        temperature: getTemperatureForTool(tool),
        stream: false
      })
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error('DeepSeek API error:', deepseekResponse.status, errorText);
      
      if (deepseekResponse.status === 401) {
        return createErrorResponse(request, 'AI service authentication failed', 500);
      } else if (deepseekResponse.status === 429) {
        return createErrorResponse(request, 'AI service rate limit exceeded. Please try again in a moment.', 429);
      } else {
        return createErrorResponse(request, 'AI service temporarily unavailable', 503);
      }
    }

    const deepseekData = await deepseekResponse.json();
    
    // Extract the AI response
    if (!deepseekData.choices || !deepseekData.choices[0] || !deepseekData.choices[0].message) {
      console.error('Unexpected DeepSeek response format:', deepseekData);
      return createErrorResponse(request, 'Invalid response from AI service', 500);
    }

    const aiResult = deepseekData.choices[0].message.content;

    if (!aiResult || aiResult.trim().length === 0) {
      return createErrorResponse(request, 'AI service returned empty response', 500);
    }

    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      result: aiResult.trim(),
      tool: tool,
      timestamp: new Date().toISOString(),
      usage: deepseekData.usage || null
    }), {
      status: 200,
      headers: {
        ...getCorsHeaders(request),
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error processing AI request:', error);
    return createErrorResponse(request, 'Internal server error occurred', 500);
  }
}

/**
 * Get max tokens based on tool type
 */
function getMaxTokensForTool(tool) {
  const tokenLimits = {
    'seo-write': 16000,  // For long-form content
    'improve': 4000,     // For text improvement
    'humanize': 4000,    // For humanizing text
    'paraphrase': 4000,  // For paraphrasing
    'detect': 1000,      // For AI detection (shorter response)
    'grammar': 4000      // For grammar correction
  };
  
  return tokenLimits[tool] || 4000;
}

/**
 * Get temperature based on tool type
 */
function getTemperatureForTool(tool) {
  const temperatures = {
    'seo-write': 0.7,    // Creative for content writing
    'improve': 0.5,      // Balanced for improvement
    'humanize': 0.8,     // More creative for humanizing
    'paraphrase': 0.6,   // Slightly creative for paraphrasing
    'detect': 0.3,       // Lower for analytical detection
    'grammar': 0.2       // Very low for precise grammar correction
  };
  
  return temperatures[tool] || 0.5;
}

/**
 * Create standardized error response
 */
function createErrorResponse(request, message, status = 400) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status: status,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Log request for debugging (in development)
 */
function logRequest(request, tool, success) {
  // Only log in development/staging environments
  if (typeof DEBUG !== 'undefined' && DEBUG) {
    console.log({
      timestamp: new Date().toISOString(),
      method: request.method,
      tool: tool,
      success: success,
      userAgent: request.headers.get('User-Agent') || 'unknown'
    });
  }
}
