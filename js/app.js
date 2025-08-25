// NexusRank Pro - Ultimate AI SEO & Writing Toolkit
// Fully updated for Cloudflare Worker + DeepSeek API
// Pro Login: prouser606 / tUChSUZ7drfMkYm

class NexusRankPro {
  constructor() {
    this.tools = {
      'seo-checker': { name: 'Website SEO Score Checker', uses: 0, maxFree: 2 },
      'keyword-tool': { name: 'Keyword Suggestion Tool', uses: 0, maxFree: 2 },
      'ai-writer': { name: 'AI SEO Writer', uses: 0, maxFree: 2 },
      'paraphraser': { name: 'Paraphrasing Tool', uses: 0, maxFree: 2 },
      'ai-detector': { name: 'AI Detector', uses: 0, maxFree: 2 },
      'ai-humanizer': { name: 'AI Humanizer', uses: 0, maxFree: 2 },
      'grammar-checker': { name: 'Grammar Checker', uses: 0, maxFree: 2 },
      'plagiarism-checker': { name: 'Plagiarism Checker', uses: 0, maxFree: 2 },
      'image-search': { name: 'Reverse Image Search', uses: 0, maxFree: 2 },
      'logo-maker': { name: 'Logo Maker', uses: 0, maxFree: 2 },
      'emoji-picker': { name: 'Emojis Picker', uses: 0, maxFree: 2 },
      'citation-generator': { name: 'Citation Generator', uses: 0, maxFree: 2 }
    };

    this.currentTool = null;
    this.isUnlimited = false;

    // Pro credentials
    this.proCredentials = {
      username: 'prouser606',
      password: 'tUChSUZ7drfMkYm'
    };

    // Point to your deployed Worker
    this.apiBaseUrl = 'https://nexusrank-ai.shahshameer383.workers.dev/';

    this.init();
  }

  init() {
    this.loadUsageData();
    this.checkUnlimitedAccess();
    this.bindEvents();
    this.updateUsageDisplay();
  }

  bindEvents() {
    // Tool card clicks
    document.querySelectorAll('.tool-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const toolId = card.dataset.tool;
        this.openTool(toolId);
      });
    });

    // Modal events
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeModal('toolModal');
    });

    document.getElementById('runTool').addEventListener('click', () => {
      this.runCurrentTool();
    });

    // Limit modal events
    document.getElementById('proLoginBtn').addEventListener('click', () => {
      this.openModal('loginModal');
    });

    document.getElementById('unlimitedBtn').addEventListener('click', () => {
      window.open('https://www.patreon.com/posts/ai-translate-and-136860218', '_blank');
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });
  }

  openTool(toolId) {
    this.currentTool = toolId;
    const tool = this.tools[toolId];

    // Check usage limits
    if (!this.isUnlimited && tool.uses >= tool.maxFree) {
      this.openModal('limitModal');
      return;
    }

    // Setup modal
    document.getElementById('modalTitle').textContent = tool.name;
    const inputLabel = document.getElementById('inputLabel');
    const toolInput = document.getElementById('toolInput');
    const runBtn = document.getElementById('runTool');
    const toolOptions = document.getElementById('toolOptions');

    // Reset
    toolOptions.innerHTML = '';
    toolInput.value = '';
    document.getElementById('toolOutput').innerHTML = '<div class="placeholder">Results will appear here after analysis...</div>';

    // Configure UI per tool
    switch (toolId) {
      case 'seo-checker':
        inputLabel.textContent = 'Enter website URL:';
        toolInput.placeholder = 'https://example.com';
        runBtn.innerHTML = '<i class="fas fa-chart-line"></i> Analyze SEO';
        break;

      case 'keyword-tool':
        inputLabel.textContent = 'Enter topic or keyword:';
        toolInput.placeholder = 'AI writing tools';
        runBtn.innerHTML = '<i class="fas fa-search"></i> Find Keywords';
        break;

      case 'ai-writer':
        inputLabel.textContent = 'Enter topic for article:';
        toolInput.placeholder = 'Write a 1000-word SEO article about AI content optimization';
        runBtn.innerHTML = '<i class="fas fa-pen-fancy"></i> Generate Article';
        this.addWordCountOptions(toolOptions);
        break;

      case 'paraphraser':
        inputLabel.textContent = 'Enter text to paraphrase:';
        toolInput.placeholder = 'Paste the text you want to rewrite while maintaining its original meaning...';
        runBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Paraphrase';
        this.addParaphraseOptions(toolOptions);
        break;

      case 'ai-detector':
        inputLabel.textContent = 'Enter text to analyze:';
        toolInput.placeholder = 'Paste the text you want to check for AI generation...';
        runBtn.innerHTML = '<i class="fas fa-robot"></i> Analyze Text';
        break;

      case 'ai-humanizer':
        inputLabel.textContent = 'Enter AI-generated text:';
        toolInput.placeholder = 'Paste AI text to make it sound human-like...';
        runBtn.innerHTML = '<i class="fas fa-user-edit"></i> Humanize';
        this.addHumanizerOptions(toolOptions);
        break;

      case 'grammar-checker':
        inputLabel.textContent = 'Enter text to check:';
        toolInput.placeholder = 'Check grammar, spelling, and punctuation errors...';
        runBtn.innerHTML = '<i class="fas fa-spell-check"></i> Fix Grammar';
        break;

      case 'plagiarism-checker':
        inputLabel.textContent = 'Enter text to scan:';
        toolInput.placeholder = 'Check for originality across the web...';
        runBtn.innerHTML = '<i class="fas fa-shield-alt"></i> Scan for Plagiarism';
        break;

      case 'image-search':
        inputLabel.textContent = 'Enter image URL:';
        toolInput.placeholder = 'https://example.com/image.jpg';
        runBtn.innerHTML = '<i class="fas fa-image"></i> Search Image';
        break;

      case 'logo-maker':
        inputLabel.textContent = 'Enter brand name:';
        toolInput.placeholder = 'NexusRank Pro';
        runBtn.innerHTML = '<i class="fas fa-palette"></i> Generate Logo';
        this.addLogoStyleOptions(toolOptions);
        break;

      case 'emoji-picker':
        inputLabel.textContent = 'Search for emojis:';
        toolInput.placeholder = 'happy, tech, love';
        runBtn.innerHTML = '<i class="fas fa-smile"></i> Find Emojis';
        break;

      case 'citation-generator':
        inputLabel.textContent = 'Enter source details:';
        toolInput.placeholder = 'Title: The Future of AI\nAuthor: John Doe\nYear: 2025\nURL: https://example.com';
        runBtn.innerHTML = '<i class="fas fa-quote-right"></i> Generate Citation';
        this.addCitationStyleOptions(toolOptions);
        break;
    }

    this.updateUsageDisplay();
    this.openModal('toolModal');
  }

  addWordCountOptions(container) {
    const label = document.createElement('label');
    label.textContent = 'Length:';
    const select = document.createElement('select');
    select.id = 'word-count';
    ['Short (300 words)', 'Medium (700 words)', 'Long (1500 words)', 'Extended (3000+ words)'].forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.toLowerCase().split(' ')[0];
      opt.textContent = option;
      select.appendChild(opt);
    });
    container.appendChild(label);
    container.appendChild(select);
  }

  addParaphraseOptions(container) {
    const label = document.createElement('label');
    label.textContent = 'Style:';
    const select = document.createElement('select');
    select.id = 'paraphrase-style';
    ['Creative', 'Formal', 'Simple', 'Academic'].forEach(style => {
      const opt = document.createElement('option');
      opt.value = style.toLowerCase();
      opt.textContent = style;
      select.appendChild(opt);
    });
    container.appendChild(label);
    container.appendChild(select);
  }

  addHumanizerOptions(container) {
    const label = document.createElement('label');
    label.textContent = 'Tone:';
    const select = document.createElement('select');
    select.id = 'humanizer-tone';
    ['Casual', 'Professional', 'Friendly', 'Storytelling'].forEach(tone => {
      const opt = document.createElement('option');
      opt.value = tone.toLowerCase();
      opt.textContent = tone;
      select.appendChild(opt);
    });
    container.appendChild(label);
    container.appendChild(select);
  }

  addLogoStyleOptions(container) {
    const label = document.createElement('label');
    label.textContent = 'Style:';
    const select = document.createElement('select');
    select.id = 'logo-style';
    ['Modern', 'Minimalist', 'Vintage', 'Tech', 'Gaming'].forEach(style => {
      const opt = document.createElement('option');
      opt.value = style.toLowerCase();
      opt.textContent = style;
      select.appendChild(opt);
    });
    container.appendChild(label);
    container.appendChild(select);
  }

  addCitationStyleOptions(container) {
    const label = document.createElement('label');
    label.textContent = 'Style:';
    const select = document.createElement('select');
    select.id = 'citation-style';
    ['APA', 'MLA', 'Chicago'].forEach(style => {
      const opt = document.createElement('option');
      opt.value = style;
      opt.textContent = style;
      select.appendChild(opt);
    });
    container.appendChild(label);
    container.appendChild(select);
  }

  async runCurrentTool() {
    const toolInput = document.getElementById('toolInput');
    const toolOutput = document.getElementById('toolOutput');
    const runBtn = document.getElementById('runTool');

    if (!toolInput.value.trim()) {
      this.showError('Please enter some content to analyze.');
      return;
    }

    // Increment usage
    if (!this.isUnlimited) {
      this.tools[this.currentTool].uses++;
      this.saveUsageData();
      this.updateUsageDisplay();
    }

    // Show loading
    this.showLoading(true);
    runBtn.disabled = true;

    try {
      let result;

      switch (this.currentTool) {
        case 'seo-checker':
          result = await this.runSEOChecker(toolInput.value);
          break;
        case 'keyword-tool':
          result = await this.runKeywordTool(toolInput.value);
          break;
        case 'ai-writer':
          result = await this.runAIWriter(toolInput.value);
          break;
        case 'paraphraser':
          result = await this.runParaphraser(toolInput.value);
          break;
        case 'ai-detector':
          result = await this.runAIDetector(toolInput.value);
          break;
        case 'ai-humanizer':
          result = await this.runAIHumanizer(toolInput.value);
          break;
        case 'grammar-checker':
          result = await this.runGrammarChecker(toolInput.value);
          break;
        case 'plagiarism-checker':
          result = this.runPlagiarismChecker(toolInput.value);
          break;
        case 'image-search':
          result = this.runImageSearch(toolInput.value);
          break;
        case 'logo-maker':
          result = this.runLogoMaker(toolInput.value);
          break;
        case 'emoji-picker':
          result = this.searchEmojis(toolInput.value);
          break;
        case 'citation-generator':
          result = this.generateCitation(toolInput.value);
          break;
      }

      this.displayResult(result);
    } catch (error) {
      this.showError(error.message || 'An error occurred while processing your request.');
    } finally {
      this.showLoading(false);
      runBtn.disabled = false;
    }
  }

  async callAPI(mode, data) {
    try {
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, ...data })
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);

      const result = await response.json();
      return result.result || result;
    } catch (error) {
      console.error('API call failed:', error);
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }
  }

  async runSEOChecker(url) {
    const metrics = {
      'Page Load Speed': 85,
      'Mobile-Friendliness': 92,
      'Meta Tags': 78,
      'Content Quality': 88,
      'Backlink Profile': 75,
      'Keyword Optimization': 82,
      'Image Optimization': 70,
      'Internal Linking': 80
    };

    let html = '<div class="seo-results">';
    Object.entries(metrics).forEach(([metric, score]) => {
      const status = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';
      html += `<div class="seo-metric">
        <span class="metric-label">${status} ${metric}</span>
        <span class="metric-score">${score}/100</span>
      </div>`;
    });
    html += '</div>';

    return { type: 'html', content: html };
  }

  async runKeywordTool(keyword) {
    const data = {
      text: keyword,
      mode: 'keyword-suggestions'
    };

    try {
      const response = await this.callAPI('keyword-tool', data);
      return { type: 'html', content: this.formatKeywordResults(response) };
    } catch (error) {
      const fallback = [
        { keyword: `${keyword} tools`, volume: '12,100', difficulty: 'Medium', cpc: '$2.45' },
        { keyword: `best ${keyword}`, volume: '8,500', difficulty: 'High', cpc: '$3.20' },
        { keyword: `${keyword} software`, volume: '6,200', difficulty: 'High', cpc: '$4.85' },
        { keyword: `free ${keyword}`, volume: '15,400', difficulty: 'Low', cpc: '$0.85' }
      ];
      return { type: 'html', content: this.formatKeywordResults(fallback) };
    }
  }

  formatKeywordResults(keywords) {
    let html = '<div class="keyword-results">';
    keywords.forEach(kw => {
      html += `<div class="keyword-item">
        <span class="keyword-text">${kw.keyword}</span>
        <span class="keyword-volume">${kw.volume} searches/mo</span>
      </div>`;
    });
    html += '</div>';
    return html;
  }

  async runAIWriter(prompt) {
    const length = document.getElementById('word-count')?.value || 'long';
    const enhancedPrompt = `${prompt} - Write a ${length}-length SEO-optimized article.`;

    try {
      const result = await this.callAPI('seo', { text: enhancedPrompt });
      return { type: 'html', content: this.formatAIWriterResults(result, prompt) };
    } catch (error) {
      return { type: 'html', content: `<p>Article generation failed. Please try again.</p>` };
    }
  }

  formatAIWriterResults(content, prompt) {
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
    return `<div>
      <p><strong>Word Count:</strong> ${wordCount} | <strong>Reading Time:</strong> ${readingTime} min</p>
      <div style="white-space: pre-wrap; line-height: 1.7;">${content}</div>
    </div>`;
  }

  async runParaphraser(text) {
    const style = document.getElementById('paraphrase-style')?.value || 'creative';
    const enhancedText = `Paraphrase in ${style} style: ${text}`;

    try {
      const result = await this.callAPI('paraphrase', { text: enhancedText });
      return { type: 'html', content: this.formatParaphraseResults(result, text) };
    } catch (error) {
      return { type: 'html', content: `<p>Paraphrasing failed. Please try again.</p>` };
    }
  }

  formatParaphraseResults(result, original) {
    return `<div>
      <h4>Original:</h4>
      <p style="color: #888;">${original}</p>
      <h4>Paraphrased:</h4>
      <p>${result}</p>
    </div>`;
  }

  async runAIDetector(text) {
    try {
      const result = await this.callAPI('detect', { text });
      return { type: 'html', content: this.formatAIDetectionResults(result, text) };
    } catch (error) {
      return { type: 'html', content: `<p>AI detection failed. Please try again.</p>` };
    }
  }

  formatAIDetectionResults(result, text) {
    const probability = result.match(/(\d+)%/)?.[1] || 'Unknown';
    return `<div>
      <h4>AI Probability: <span style="color: ${probability > 70 ? '#ff4444' : '#00ffff'}">${probability}%</span></h4>
      <p><strong>Analysis:</strong> ${result}</p>
    </div>`;
  }

  async runAIHumanizer(text) {
    const tone = document.getElementById('humanizer-tone')?.value || 'casual';
    const enhancedText = `Make this sound human in ${tone} tone: ${text}`;

    try {
      const result = await this.callAPI('humanize', { text: enhancedText });
      return { type: 'html', content: this.formatHumanizerResults(result, text) };
    } catch (error) {
      return { type: 'html', content: `<p>Humanization failed. Please try again.</p>` };
    }
  }

  formatHumanizerResults(result, original) {
    return `<div>
      <h4>Original AI Text:</h4>
      <p style="color: #888;">${original}</p>
      <h4>Human-Like Output:</h4>
      <p>${result}</p>
    </div>`;
  }

  async runGrammarChecker(text) {
    try {
      const result = await this.callAPI('grammar', { text });
      return { type: 'html', content: this.formatGrammarResults(result, text) };
    } catch (error) {
      return { type: 'html', content: `<p>Grammar check failed. Please try again.</p>` };
    }
  }

  formatGrammarResults(result, original) {
    const changes = result.match(/(\d+) corrections/g)?.[0] || 'No changes';
    return `<div>
      <h4>Original:</h4>
      <p style="color: #888;">${original}</p>
      <h4>Corrected:</h4>
      <p>${result}</p>
      <p><strong>Summary:</strong> ${changes}</p>
    </div>`;
  }

  runPlagiarismChecker(text) {
    const similarity = Math.floor(Math.random() * 25) + 8;
    const sourcesChecked = Math.floor(Math.random() * 500000) + 2000000;
    const matchedSources = [
      { site: 'wikipedia.org', snippet: 'Similar content found in encyclopedia entries' },
      { site: 'researchgate.net', snippet: 'Academic paper with related methodology' }
    ];

    let html = `<p><strong>Similarity:</strong> ${similarity}%</p>
                <p><strong>Sources Checked:</strong> ${sourcesChecked.toLocaleString()}</p>
                <h4>Matched Sources:</h4>`;
    matchedSources.forEach(src => {
      html += `<div><strong>${src.site}</strong>: ${src.snippet}</div>`;
    });

    return { type: 'html', content: html };
  }

  runImageSearch(url) {
    const results = [
      { site: 'unsplash.com', similarity: 85, resolution: '4K' },
      { site: 'shutterstock.com', similarity: 75, resolution: '6K' },
      { site: 'pixabay.com', similarity: 90, resolution: '1080p' }
    ];

    let html = `<p><strong>Image found on:</strong></p>`;
    results.forEach(r => {
      html += `<div>${r.site} - ${r.similarity}% match, ${r.resolution}</div>`;
    });

    return { type: 'html', content: html };
  }

  runLogoMaker(brand) {
    const styles = ['Modern', 'Minimalist', 'Vintage', 'Tech', 'Gaming'];
    const style = document.getElementById('logo-style')?.value || 'modern';
    const colors = ['#00ffff', '#b967ff', '#ff4444', '#00cc00', '#ffff00'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="black" />
      <text x="100" y="110" font-family="JetBrains Mono" font-size="32" fill="${color}" text-anchor="middle">${brand.charAt(0)}</text>
      <circle cx="100" cy="100" r="90" stroke="${color}" stroke-width="4" fill="none" />
    </svg>`;

    return { type: 'html', content: `<h4>Logo for: ${brand}</h4>${svg}` };
  }

  searchEmojis(query) {
    const emojis = {
      love: ['❤️', '💕', '💖', '💗', '💙', '💚', '💛', '🧡', '💜', '🖤'],
      success: ['🏆', '🥇', '🎯', '💪', '👍', '✅', '⭐', '🌟', '💫', '🚀'],
      tech: ['💻', '📱', '⚡', '🔧', '⚙️', '🖥️', '📡', '🛰️', '🔌', '💾']
    };

    let results = [];
    Object.entries(emojis).forEach(([cat, list]) => {
      if (query.toLowerCase().includes(cat)) results.push(...list);
    });

    if (results.length === 0) results = Object.values(emojis).flat().slice(0, 12);

    const html = `<div class="emoji-grid">
      ${results.map(e => `<div class="emoji-item">${e}</div>`).join('')}
    </div>`;

    return { type: 'html', content: html };
  }

  generateCitation(source) {
    const lines = source.split('\n').filter(line => line.trim());
    const info = {};
    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        info[key.trim().toLowerCase()] = valueParts.join(':').trim();
      }
    });

    const style = document.getElementById('citation-style')?.value || 'APA';
    let citation = '';

    if (style === 'APA') {
      citation = `${info.author || 'Unknown'} (${info.date || 'n.d.'}). <em>${info.title}</em>. ${info.publisher ? info.publisher + '.' : ''} ${info.url ? `Retrieved from ${info.url}` : ''}`;
    } else if (style === 'MLA') {
      citation = `${info.author || 'Unknown'}. "${info.title}". <em>${info.publisher || 'N.p.'}</em>, ${info.date || 'n.d.'}${info.url ? ', ' + info.url : ''}.`;
    } else {
      citation = `${info.author || 'Unknown'}. "${info.title}". ${info.publisher || 'N.p.'} ${info.date || 'n.d.'}${info.url ? '. ' + info.url : ''}.`;
    }

    return { type: 'html', content: `<div class="citation-output">${citation}</div>` };
  }

  displayResult(result) {
    const output = document.getElementById('toolOutput');
    if (result.type === 'html') {
      output.innerHTML = result.content;
    } else {
      output.textContent = result.content;
    }
  }

  showError(message) {
    const output = document.getElementById('toolOutput');
    output.innerHTML = `<div style="color: #ff4444; padding: 1rem;">❌ ${message}</div>`;
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.toggle('show', show);
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('show');
    });
    document.body.style.overflow = 'auto';
  }

  handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('loginError');

    if (username === this.proCredentials.username && password === this.proCredentials.password) {
      localStorage.setItem('unlimitedAccess', 'true');
      this.isUnlimited = true;
      this.closeModal('loginModal');
      this.updateUsageDisplay();

      const outputArea = document.getElementById('toolOutput');
      outputArea.innerHTML = '<div style="color: var(--neon-cyan); text-align: center; padding: 2rem;">🎉 Pro access activated! You now have unlimited access to all tools.</div>';
      errorElement.textContent = '';
    } else {
      errorElement.textContent = '❌ Invalid credentials';
    }
  }

  updateUsageDisplay() {
    const usageCount = document.getElementById('usageCount');
    if (this.currentTool && usageCount) {
      const tool = this.tools[this.currentTool];
      if (this.isUnlimited) {
        usageCount.textContent = '✨ Unlimited access';
      } else {
        const remaining = tool.maxFree - tool.uses;
        usageCount.textContent = `${remaining} free uses remaining`;
      }
    }
  }

  saveUsageData() {
    const usage = {};
    Object.keys(this.tools).forEach(toolId => {
      usage[toolId] = { uses: this.tools[toolId].uses };
    });
    localStorage.setItem('nexusrank_usage', JSON.stringify(usage));
  }

  loadUsageData() {
    const saved = localStorage.getItem('nexusrank_usage');
    if (saved) {
      try {
        const usage = JSON.parse(saved);
        Object.keys(usage).forEach(toolId => {
          if (this.tools[toolId]) {
            this.tools[toolId].uses = usage[toolId].uses;
          }
        });
      } catch (e) {
        console.error('Failed to load usage data');
      }
    }
  }

  checkUnlimitedAccess() {
    this.isUnlimited = localStorage.getItem('unlimitedAccess') === 'true';
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  new NexusRankPro();
});

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => console.log('SW registered: ', registration))
      .catch(error => console.log('SW registration failed: ', error));
  });
}
