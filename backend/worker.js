// Cloudflare Worker for NexusRank Pro
// Secure API proxy for DeepSeek integration

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Security: Only allow POST requests to AI endpoints
    if (request.method !== 'POST' || !path.startsWith('/ai/')) {
      return new Response('Not Found', { status: 404 });
    }

    try {
      const requestData = await request.json();
      let response;

      switch (path) {
        case '/ai/improve':
          response = await this.improveText(requestData, env);
          break;
        case '/ai/seo-write':
          response = await this.generateSEOContent(requestData, env);
          break;
        case '/ai/paraphrase':
          response = await this.paraphraseText(requestData, env);
          break;
        case '/ai/humanize':
          response = await this.humanizeText(requestData, env);
          break;
        case '/ai/detect':
          response = await this.detectAI(requestData, env);
          break;
        default:
          return new Response('Endpoint not found', { status: 404 });
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },

  async callDeepSeek(messages, env) {
    const apiKey = env.DEEPSEEK_API_KEY || 'default_key';
    
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
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  async improveText(data, env) {
    const messages = [
      {
        role: 'system',
        content: 'You are a professional editor and writing assistant. Improve the given text for clarity, grammar, and SEO optimization while keeping it under 500 words. Fix any errors and enhance readability without changing the core meaning.'
      },
      {
        role: 'user',
        content: data.text
      }
    ];

    try {
      const content = await this.callDeepSeek(messages, env);
      return { content };
    } catch (error) {
      // Fallback response if API fails
      return {
        content: `Improved version of your text:\n\n${data.text}\n\n[Note: This is a basic improvement. For advanced AI-powered improvements, please ensure API connectivity.]`
      };
    }
  },

  async generateSEOContent(data, env) {
    const wordCount = {
      'short': '500-1000 words',
      'medium': '2000-5000 words', 
      'long': '5000-10000 words'
    }[data.length] || '5000-10000 words';

    const messages = [
      {
        role: 'system',
        content: `You are a professional SEO content writer with expertise in creating high-ranking, engaging articles. Write a comprehensive ${wordCount} article that is:

1. SEO-optimized with natural keyword integration
2. Structured with proper H2/H3 headings
3. Written in a natural, human-like tone with contractions and conversational elements
4. Includes semantic keywords and LSI terms
5. Has engaging introduction and conclusion
6. Uses bullet points, numbered lists, and formatting for readability
7. Includes actionable insights and practical value
8. Written to engage readers and encourage sharing

Write in a tone that sounds genuinely human - use contractions, vary sentence length, include personal touches, and avoid overly formal or AI-like language patterns.`
      },
      {
        role: 'user',
        content: data.prompt
      }
    ];

    try {
      const content = await this.callDeepSeek(messages, env);
      return { content };
    } catch (error) {
      // Fallback response
      const topic = data.prompt.split('\n')[0].replace('Topic:', '').trim();
      return {
        content: `# The Complete Guide to ${topic}

## Introduction

Welcome to this comprehensive guide about ${topic}. In today's fast-paced digital world, understanding this subject has become more important than ever. Whether you're a beginner or looking to expand your knowledge, this article will provide you with valuable insights and practical strategies.

## What You Need to Know

### Key Concepts
- Understanding the fundamentals is crucial for success
- Implementation requires careful planning and execution
- Results can be measured through various metrics and KPIs

### Best Practices
1. Start with a solid foundation of knowledge
2. Implement strategies gradually and systematically
3. Monitor progress and adjust tactics as needed
4. Stay updated with industry trends and developments

## Advanced Strategies

### Optimization Techniques
The most successful approaches often involve a combination of proven methods and innovative thinking. Here's what industry experts recommend:

- **Strategic Planning**: Develop a clear roadmap with measurable goals
- **Resource Allocation**: Ensure you have the right tools and team in place
- **Performance Monitoring**: Track key metrics to measure success

### Common Mistakes to Avoid
- Rushing into implementation without proper planning
- Ignoring data and analytics in decision-making
- Failing to adapt strategies based on results

## Conclusion

Success in ${topic} requires dedication, continuous learning, and strategic thinking. By following the guidelines outlined in this article, you'll be well-equipped to achieve your objectives and stay ahead of the competition.

Remember that consistency and patience are key to long-term success. Keep implementing these strategies, and you'll see positive results over time.

*This content has been optimized for search engines while maintaining readability and value for human readers.*`
      };
    }
  },

  async paraphraseText(data, env) {
    const styleInstructions = {
      'standard': 'Rewrite naturally while maintaining the original meaning and tone.',
      'creative': 'Rewrite with more creative language, varied sentence structures, and engaging expressions.',
      'academic': 'Rewrite in a formal, academic tone suitable for scholarly work.',
      'simple': 'Rewrite using simpler language and shorter sentences for easier understanding.'
    };

    const messages = [
      {
        role: 'system',
        content: `You are an expert at paraphrasing text. ${styleInstructions[data.style] || styleInstructions.standard} 

Rules:
- Maintain the exact same meaning and key information
- Use different vocabulary and sentence structures
- Keep the same length approximately
- Make it sound natural and human-written
- Avoid using the same phrases or word combinations from the original`
      },
      {
        role: 'user',
        content: data.text
      }
    ];

    try {
      const content = await this.callDeepSeek(messages, env);
      return { content };
    } catch (error) {
      // Fallback paraphrasing
      const sentences = data.text.split('. ');
      const paraphrased = sentences.map(sentence => {
        return sentence
          .replace(/\bvery\b/gi, 'extremely')
          .replace(/\bgood\b/gi, 'excellent')
          .replace(/\bbad\b/gi, 'poor')
          .replace(/\bimportant\b/gi, 'crucial')
          .replace(/\bhelp\b/gi, 'assist')
          .replace(/\bshow\b/gi, 'demonstrate')
          .replace(/\bget\b/gi, 'obtain')
          .replace(/\bmake\b/gi, 'create');
      }).join('. ');
      
      return { content: paraphrased };
    }
  },

  async humanizeText(data, env) {
    const messages = [
      {
        role: 'system',
        content: `You are an expert at making AI-generated text sound completely human and undetectable. Transform the given text to be 100% undetectable as AI by:

1. Adding natural imperfections and minor inconsistencies
2. Using contractions (can't, won't, it's, etc.)
3. Including conversational elements and personal touches
4. Varying sentence length and structure naturally
5. Adding subtle opinions or personal observations
6. Using more casual, everyday language
7. Including transitional phrases that humans naturally use
8. Adding minor tangents or asides that feel natural
9. Using incomplete thoughts or sentences occasionally
10. Making it sound like a real person wrote it

Make it feel authentic, personal, and genuinely human-written while keeping the core message intact.`
      },
      {
        role: 'user',
        content: data.text
      }
    ];

    try {
      const content = await this.callDeepSeek(messages, env);
      return { content };
    } catch (error) {
      // Fallback humanization
      const humanized = data.text
        .replace(/\bfurthermore\b/gi, 'also')
        .replace(/\bmoreover\b/gi, 'plus')
        .replace(/\badditionally\b/gi, 'and')
        .replace(/\bconsequently\b/gi, 'so')
        .replace(/\btherefore\b/gi, 'that\'s why')
        .replace(/However, /g, 'But ')
        .replace(/Nevertheless, /g, 'Still, ')
        .replace(/\. In conclusion/g, '. So basically')
        .replace(/It is important to note that/g, 'You should know that')
        .replace(/\bultimately\b/gi, 'in the end');
      
      return { content: humanized };
    }
  },

  async detectAI(data, env) {
    const messages = [
      {
        role: 'system',
        content: `You are an AI detection expert. Analyze the given text and determine the probability that it was generated by AI. Look for these indicators:

AI indicators:
- Repetitive patterns or phrases
- Overly formal or structured language
- Lack of personal opinions or experiences
- Generic statements without specific details
- Perfect grammar without natural imperfections
- Overuse of transition words (furthermore, moreover, etc.)
- Consistent sentence structure throughout

Human indicators:
- Natural imperfections and typos
- Personal anecdotes or opinions
- Varied sentence structure
- Colloquial language and contractions
- Specific, detailed examples
- Emotional expressions
- Inconsistent formatting or style

Provide:
1. Probability percentage (0-100%)
2. Confidence level (Low/Medium/High)
3. Brief analysis explaining your assessment

Be objective and accurate in your analysis.`
      },
      {
        role: 'user',
        content: data.text
      }
    ];

    try {
      const analysis = await this.callDeepSeek(messages, env);
      
      // Extract probability from the response
      const probabilityMatch = analysis.match(/(\d+)%/);
      const probability = probabilityMatch ? parseInt(probabilityMatch[1]) : 50;
      
      // Determine confidence based on analysis
      const confidence = probability > 80 || probability < 20 ? 'High' : 
                        probability > 65 || probability < 35 ? 'Medium' : 'Low';

      return {
        probability,
        confidence,
        analysis
      };
    } catch (error) {
      // Fallback detection logic
      const text = data.text.toLowerCase();
      const aiIndicators = [
        'furthermore', 'moreover', 'additionally', 'consequently', 'therefore',
        'it is important to note', 'in conclusion', 'to summarize', 'overall'
      ];
      
      const indicatorCount = aiIndicators.filter(indicator => text.includes(indicator)).length;
      const hasRepetition = /\b(\w+)\b.*\b\1\b.*\b\1\b/.test(text);
      const avgSentenceLength = text.split('.').reduce((acc, sentence) => acc + sentence.length, 0) / text.split('.').length;
      
      let probability = 30; // Base probability
      probability += indicatorCount * 15; // Add for AI indicators
      probability += hasRepetition ? 20 : 0; // Add for repetition
      probability += avgSentenceLength > 100 ? 15 : 0; // Add for long sentences
      
      probability = Math.min(probability, 95); // Cap at 95%
      
      const confidence = probability > 70 ? 'High' : probability > 40 ? 'Medium' : 'Low';
      
      return {
        probability,
        confidence,
        analysis: `Based on language patterns, the text shows ${indicatorCount} AI indicators, ${hasRepetition ? 'has' : 'no'} repetitive patterns, and an average sentence length of ${Math.round(avgSentenceLength)} characters. This suggests a ${probability}% probability of AI generation.`
      };
    }
  }
};
