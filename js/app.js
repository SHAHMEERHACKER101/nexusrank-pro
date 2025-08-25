/**
 * NexusRank Pro - Final AI SEO Toolkit
 * Powered by Google Gemini via Cloudflare Worker
 */

class NexusRankApp {
  constructor() {
    // ✅ Fixed URL (no trailing spaces!)
    this.apiBaseUrl = 'https://nexusrank-ai.shahshameer383.workers.dev';

    this.currentTool = null;
    this.isProUser = false;
    this.usageData = this.loadUsageData();

    // Tool configurations
    this.tools = {
      'seo-writer': {
        name: 'AI SEO Writer',
        endpoint: '/ai/seo-write',
        inputLabel: 'Enter your topic or keywords:',
        placeholder: 'Best AI Tools for Content Marketing',
        prompt: 'Write a 5000-10000 word SEO-optimized article. Use H2/H3, bullet points, natural keywords, and human tone.'
      },
      'humanizer': {
        name: 'AI Humanizer',
        endpoint: '/ai/humanize',
        inputLabel: 'Enter AI-generated text to humanize:',
        placeholder: 'Paste AI text to make it sound human...',
        prompt: 'Make this sound 100% human. Add contractions, imperfections, and conversational flow.'
      },
      'detector': {
        name: 'AI Detector',
        endpoint: '/ai/detect',
        inputLabel: 'Enter text to analyze for AI content:',
        placeholder: 'Paste text to check if it’s AI-generated...',
        prompt: 'Analyze this text and estimate the AI probability. Respond with: "AI Probability: X%" and reasoning.'
      },
      'paraphrase': {
        name: 'Paraphrasing Tool',
        endpoint: '/ai/paraphrase',
        inputLabel: 'Enter text to paraphrase:',
        placeholder: 'Rewrite this text to be unique and natural...',
        prompt: 'Rewrite this to be 100% unique and undetectable as AI. Keep meaning but change structure.'
      },
      'grammar': {
        name: 'Grammar Checker',
        endpoint: '/ai/grammar',
        inputLabel: 'Enter text to fix grammar:',
        placeholder: 'Fix grammar, spelling, and punctuation errors...',
        prompt: 'Fix all grammar, spelling, and punctuation errors. Return only the corrected version.'
      },
      'improve': {
        name: 'Text Improver',
        endpoint: '/ai/improve',
        inputLabel: 'Enter text to improve:',
        placeholder: 'Enhance clarity, fluency, and professionalism...',
        prompt: 'Improve this text for clarity, fluency, and professionalism.'
      }
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateUsageDisplay();
    this.checkProStatus();
  }

  setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }

    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger?.classList.remove('active');
        navMenu?.classList.remove('active');
      });
    });

    // Modal close on backdrop click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.closeTool();
        this.closeProLogin();
      }
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTool();
        this.closeProLogin();
      }
    });

    // Pro login form
    const proLoginForm = document.getElementById('pro-login-form');
    if (proLoginForm) {
      proLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleProLogin();
      });
    }

    // Smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  loadUsageData() {
    try {
      const data = localStorage.getItem('nexusrank_usage');
      return data ? JSON.parse(data) : this.getDefaultUsageData();
    } catch (error) {
      console.error('Error loading usage data:', error);
      return this.getDefaultUsageData();
    }
  }

  getDefaultUsageData() {
    const usage = {};
    Object.keys(this.tools).forEach(tool => {
      usage[tool] = { count: 0, lastReset: Date.now() };
    });
    return usage;
  }

  saveUsageData() {
    try {
      localStorage.setItem('nexusrank_usage', JSON.stringify(this.usageData));
    } catch (error) {
      console.error('Error saving usage data:', error);
    }
  }

  canUseFreeTool(toolName) {
    if (this.isProUser) return true;

    const tool = this.usageData[toolName];
    if (!tool) return true;

    const now = Date.now();
    const daysSinceReset = (now - tool.lastReset) / (1000 * 60 * 60 * 24);

    if (daysSinceReset >= 1) {
      tool.count = 0;
      tool.lastReset = now;
      this.saveUsageData();
    }

    return tool.count < 2;
  }

  incrementUsage(toolName) {
    if (this.isProUser) return;

    if (!this.usageData[toolName]) {
      this.usageData[toolName] = { count: 0, lastReset: Date.now() };
    }

    this.usageData[toolName].count++;
    this.saveUsageData();
    this.updateUsageDisplay();
  }

  updateUsageDisplay() {
    const usageCountElement = document.getElementById('usage-count');
    if (usageCountElement && this.currentTool) {
      if (this.isProUser) {
        usageCountElement.textContent = '∞';
        usageCountElement.parentElement.innerHTML = '<span class="usage-count">Pro User - Unlimited uses</span>';
      } else {
        const remaining = Math.max(0, 2 - (this.usageData[this.currentTool]?.count || 0));
        usageCountElement.textContent = remaining;
      }
    }
  }

  checkProStatus() {
    try {
      this.isProUser = localStorage.getItem('nexusrank_pro') === 'true';
    } catch (error) {
      console.error('Error checking pro status:', error);
      this.isProUser = false;
    }
  }

  openTool(toolName) {
    const tool = this.tools[toolName];
    if (!tool) {
      console.error('Tool not found:', toolName);
      return;
    }

    this.currentTool = toolName;

    // Update modal
    document.getElementById('modal-title').textContent = tool.name;
    document.getElementById('input-label').textContent = tool.inputLabel;
    document.getElementById('tool-input').placeholder = tool.placeholder;
    document.getElementById('tool-input').value = '';

    // Reset output
    document.getElementById('output-section').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('tool-output').innerHTML = '';

    this.updateUsageDisplay();

    // Show modal
    document.getElementById('tool-modal').classList.add('show');
    document.body.style.overflow = 'hidden';

    // Focus input
    setTimeout(() => {
      document.getElementById('tool-input').focus();
    }, 100);
  }

  closeTool() {
    document.getElementById('tool-modal').classList.remove('show');
    document.body.style.overflow = 'auto';
    this.currentTool = null;
  }

  clearInput() {
    document.getElementById('tool-input').value = '';
    document.getElementById('tool-input').focus();
  }

  async processText() {
    const inputText = document.getElementById('tool-input').value.trim();

    if (!inputText) {
      this.showError('Please enter some text to process.');
      return;
    }

    if (!this.currentTool) {
      this.showError('No tool selected.');
      return;
    }

    if (!this.canUseFreeTool(this.currentTool)) {
      this.showError('You have reached your free usage limit. Upgrade to Pro for unlimited access.');
      return;
    }

    const processBtn = document.getElementById('process-btn');
    const loading = document.getElementById('loading');
    const outputSection = document.getElementById('output-section');

    processBtn.disabled = true;
    processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    loading.style.display = 'block';
    outputSection.style.display = 'none';

    try {
      const tool = this.tools[this.currentTool];
      const response = await this.makeAPIRequest(tool.endpoint, {
        text: inputText,
        prompt: tool.prompt
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to process text');
      }

      this.showResult(response.result);
      this.incrementUsage(this.currentTool);

    } catch (error) {
      console.error('Processing error:', error);
      this.showError(`Error: ${error.message}`);
    } finally {
      processBtn.disabled = false;
      processBtn.innerHTML = '<i class="fas fa-cog"></i> Process';
      loading.style.display = 'none';
    }
  }

  async makeAPIRequest(endpoint, data) {
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  showResult(result) {
    const outputSection = document.getElementById('output-section');
    const toolOutput = document.getElementById('tool-output');
    toolOutput.innerHTML = this.formatOutput(result);
    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  formatOutput(text) {
    return text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/<p><\/p>/g, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  showError(message) {
    const outputSection = document.getElementById('output-section');
    const toolOutput = document.getElementById('tool-output');
    toolOutput.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
    outputSection.style.display = 'block';
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async copyOutput() {
    const toolOutput = document.getElementById('tool-output');
    const text = toolOutput.textContent || toolOutput.innerText;

    try {
      await navigator.clipboard.writeText(text);
      this.showTemporaryMessage('Copied to clipboard!', 'success');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showTemporaryMessage('Copied (fallback)!', 'success');
    }
  }

  downloadOutput() {
    const toolOutput = document.getElementById('tool-output');
    const text = toolOutput.textContent || toolOutput.innerText;
    const tool = this.tools[this.currentTool];

    if (!text.trim()) {
      this.showTemporaryMessage('No content to download.', 'error');
      return;
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.name.toLowerCase().replace(/\s+/g, '-')}-output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showTemporaryMessage('File downloaded!', 'success');
  }

  showTemporaryMessage(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `temp-message ${type}`;
    el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i> ${message}`;
    el.style.cssText = `
      position: fixed; top: 80px; right: 20px; background: ${type === 'success' ? '#00cc00' : '#ff4444'};
      color: white; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 3000; animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  showProLogin() {
    document.getElementById('pro-modal').classList.add('show');
    setTimeout(() => document.getElementById('pro-username').focus(), 100);
  }

  closeProLogin() {
    document.getElementById('pro-modal').classList.remove('show');
    document.getElementById('pro-login-form').reset();
  }

  handleProLogin() {
    const username = document.getElementById('pro-username').value.trim();
    const password = document.getElementById('pro-password').value.trim();

    if (username === 'prouser606' && password === 'tUChSUZ7drfMkYm') {
      this.isProUser = true;
      localStorage.setItem('nexusrank_pro', 'true');
      this.updateUsageDisplay();
      this.closeProLogin();
      this.showTemporaryMessage('Welcome, Pro user!', 'success');
    } else {
      this.showTemporaryMessage('Invalid credentials.', 'error');
    }
  }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOutRight { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// Export
window.NexusRankApp = NexusRankApp;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new NexusRankApp();
});
