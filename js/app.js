/**
 * NexusRank Pro - AI SEO Toolkit Application
 * Professional AI-powered SEO tools with real DeepSeek integration
 */
class NexusRankApp {
    constructor() {
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
                placeholder: 'Enter the topic you want to write about (e.g., "Best AI Tools for Content Marketing")',
                prompt: 'You are a top-tier SEO content writer. Write a comprehensive 5000-10000 word article on the topic. Use H2/H3 headings, bullet points, natural keyword integration, and human-like tone. Avoid AI patterns. Sound like a real expert writing for professionals in the field. Include practical examples, actionable insights, and current industry trends.'
            },
            'humanizer': {
                name: 'AI Humanizer',
                endpoint: '/ai/humanize',
                inputLabel: 'Enter AI-generated text to humanize:',
                placeholder: 'Paste your AI-generated text here that you want to make sound more human...',
                prompt: 'Transform this AI text to sound 100% human. Add contractions, minor imperfections, personal tone, conversational flow, and natural language patterns. Remove robotic phrasing, vary sentence structure, and make it completely undetectable as AI-generated content. Maintain the core message while making it sound like it was written by a knowledgeable human expert.'
            },
            'detector': {
                name: 'AI Detector',
                endpoint: '/ai/detect',
                inputLabel: 'Enter text to analyze for AI content:',
                placeholder: 'Paste the text you want to analyze for AI-generated content...',
                prompt: 'Analyze this text carefully and estimate the probability it was AI-generated. Look for patterns like repetitive phrasing, unnatural flow, overly formal tone, generic statements, and lack of personal insights. Respond with: "AI Probability: X%" followed by a detailed 2-3 sentence explanation of your reasoning, highlighting specific indicators that led to your assessment.'
            },
            'paraphrase': {
                name: 'Paraphrasing Tool',
                endpoint: '/ai/paraphrase',
                inputLabel: 'Enter text to paraphrase:',
                placeholder: 'Enter the text you want to rewrite and make unique...',
                prompt: 'Rewrite this text to be 100% unique and undetectable as AI-generated. Use completely different sentence structures, synonyms, and phrasing while preserving the exact meaning. Make it fresh, engaging, and natural. Vary the writing style and tone to sound distinctly different from the original while maintaining all key information and context.'
            },
            'grammar': {
                name: 'Grammar Checker',
                endpoint: '/ai/grammar',
                inputLabel: 'Enter text to check and fix grammar:',
                placeholder: 'Paste your text here to fix grammar, spelling, and punctuation errors...',
                prompt: 'Fix all grammar, spelling, punctuation, and syntax errors in this text. Correct awkward phrasing, improve sentence structure, and ensure proper formatting. Return only the corrected version with no explanations or markup - just the clean, error-free text that maintains the original meaning and tone.'
            },
            'improve': {
                name: 'Text Improver',
                endpoint: '/ai/improve',
                inputLabel: 'Enter text to improve:',
                placeholder: 'Enter the text you want to enhance for clarity and engagement...',
                prompt: 'Enhance this text for maximum clarity, fluency, and professionalism while maintaining the core message. Improve readability, engagement, and flow. Make it more compelling and polished without changing the fundamental meaning. Add sophistication where appropriate and ensure it sounds authoritative and well-written.'
            }
        };
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.updateUsageDisplay();
        this.checkProStatus();
    }

    /**
     * Setup event listeners for the application
     */
    setupEventListeners() {
        // Mobile hamburger menu
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Close mobile menu when clicking nav links
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

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Load usage data from localStorage
     */
    loadUsageData() {
        try {
            const data = localStorage.getItem('nexusrank_usage');
            return data ? JSON.parse(data) : this.getDefaultUsageData();
        } catch (error) {
            console.error('Error loading usage data:', error);
            return this.getDefaultUsageData();
        }
    }

    /**
     * Get default usage data structure
     */
    getDefaultUsageData() {
        const tools = Object.keys(this.tools);
        const usage = {};
        tools.forEach(tool => {
            usage[tool] = { count: 0, lastReset: Date.now() };
        });
        return usage;
    }

    /**
     * Save usage data to localStorage
     */
    saveUsageData() {
        try {
            localStorage.setItem('nexusrank_usage', JSON.stringify(this.usageData));
        } catch (error) {
            console.error('Error saving usage data:', error);
        }
    }

    /**
     * Check if user has remaining uses for a tool
     */
    canUseFreeTool(toolName) {
        if (this.isProUser) return true;
        
        const toolUsage = this.usageData[toolName];
        if (!toolUsage) return true;
        
        // Reset daily usage (24 hours)
        const now = Date.now();
        const daysSinceReset = (now - toolUsage.lastReset) / (1000 * 60 * 60 * 24);
        
        if (daysSinceReset >= 1) {
            toolUsage.count = 0;
            toolUsage.lastReset = now;
            this.saveUsageData();
        }
        
        return toolUsage.count < 2;
    }

    /**
     * Increment usage count for a tool
     */
    incrementUsage(toolName) {
        if (this.isProUser) return;
        
        if (!this.usageData[toolName]) {
            this.usageData[toolName] = { count: 0, lastReset: Date.now() };
        }
        
        this.usageData[toolName].count++;
        this.saveUsageData();
        this.updateUsageDisplay();
    }

    /**
     * Update usage display in UI
     */
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

    /**
     * Check pro user status
     */
    checkProStatus() {
        try {
            const proStatus = localStorage.getItem('nexusrank_pro');
            this.isProUser = proStatus === 'true';
        } catch (error) {
            console.error('Error checking pro status:', error);
            this.isProUser = false;
        }
    }

    /**
     * Open tool modal
     */
    openTool(toolName) {
        const tool = this.tools[toolName];
        if (!tool) {
            console.error('Tool not found:', toolName);
            return;
        }

        this.currentTool = toolName;
        
        // Update modal content
        document.getElementById('modal-title').textContent = tool.name;
        document.getElementById('input-label').textContent = tool.inputLabel;
        document.getElementById('tool-input').placeholder = tool.placeholder;
        document.getElementById('tool-input').value = '';
        
        // Reset modal state
        document.getElementById('output-section').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        document.getElementById('tool-output').innerHTML = '';
        
        // Update usage display
        this.updateUsageDisplay();
        
        // Show modal
        document.getElementById('tool-modal').classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus on input
        setTimeout(() => {
            document.getElementById('tool-input').focus();
        }, 100);
    }

    /**
     * Close tool modal
     */
    closeTool() {
        document.getElementById('tool-modal').classList.remove('show');
        document.body.style.overflow = 'auto';
        this.currentTool = null;
    }

    /**
     * Clear input text
     */
    clearInput() {
        document.getElementById('tool-input').value = '';
        document.getElementById('tool-input').focus();
    }

    /**
     * Process text with AI
     */
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

        // Check usage limits
        if (!this.canUseFreeTool(this.currentTool)) {
            this.showError('You have reached your free usage limit for this tool. Please upgrade to Pro for unlimited access.');
            return;
        }

        const tool = this.tools[this.currentTool];
        const processBtn = document.getElementById('process-btn');
        const loading = document.getElementById('loading');
        const outputSection = document.getElementById('output-section');

        try {
            // Show loading state
            processBtn.disabled = true;
            processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            loading.style.display = 'block';
            outputSection.style.display = 'none';

            // Make API request
            const response = await this.makeAPIRequest(tool.endpoint, {
                text: inputText,
                prompt: tool.prompt
            });

            if (!response.success) {
                throw new Error(response.error || 'Failed to process text');
            }

            // Show result
            this.showResult(response.result);
            
            // Increment usage count
            this.incrementUsage(this.currentTool);

        } catch (error) {
            console.error('Processing error:', error);
            this.showError(`Error processing text: ${error.message}`);
        } finally {
            // Reset UI state
            processBtn.disabled = false;
            processBtn.innerHTML = '<i class="fas fa-cog"></i> Process';
            loading.style.display = 'none';
        }
    }

    /**
     * Make API request to backend
     */
    async makeAPIRequest(endpoint, data) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    /**
     * Show processing result
     */
    showResult(result) {
        const outputSection = document.getElementById('output-section');
        const toolOutput = document.getElementById('tool-output');
        
        toolOutput.innerHTML = this.formatOutput(result);
        outputSection.style.display = 'block';
        
        // Scroll to output
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Format output text for display
     */
    formatOutput(text) {
        // Basic formatting for better readability
        return text
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')
            .replace(/<p><\/p>/g, '')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    /**
     * Show error message
     */
    showError(message) {
        const outputSection = document.getElementById('output-section');
        const toolOutput = document.getElementById('tool-output');
        
        toolOutput.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
        outputSection.style.display = 'block';
        
        // Scroll to error
        outputSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Copy output to clipboard
     */
    async copyOutput() {
        const toolOutput = document.getElementById('tool-output');
        const text = toolOutput.textContent || toolOutput.innerText;
        
        try {
            await navigator.clipboard.writeText(text);
            this.showTemporaryMessage('Text copied to clipboard!', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                this.showTemporaryMessage('Text copied to clipboard!', 'success');
            } catch (fallbackError) {
                this.showTemporaryMessage('Failed to copy text. Please select and copy manually.', 'error');
            }
            
            document.body.removeChild(textArea);
        }
    }

    /**
     * Download output as text file
     */
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
        
        this.showTemporaryMessage('File downloaded successfully!', 'success');
    }

    /**
     * Show temporary message
     */
    showTemporaryMessage(message, type = 'success') {
        const messageEl = document.createElement('div');
        messageEl.className = `temp-message ${type}`;
        messageEl.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'exclamation-triangle'}"></i> ${message}`;
        
        messageEl.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-lg);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Show pro login modal
     */
    showProLogin() {
        document.getElementById('pro-modal').classList.add('show');
        setTimeout(() => {
            document.getElementById('pro-username').focus();
        }, 100);
    }

    /**
     * Close pro login modal
     */
    closeProLogin() {
        document.getElementById('pro-modal').classList.remove('show');
        document.getElementById('pro-login-form').reset();
    }

    /**
     * Handle pro login
     */
    handleProLogin() {
        const username = document.getElementById('pro-username').value.trim();
        const password = document.getElementById('pro-password').value.trim();
        
        // Check credentials
        if (username === 'prouser606' && password === 'tUChSUZ7drfMkYm') {
            // Set pro status
            this.isProUser = true;
            localStorage.setItem('nexusrank_pro', 'true');
            
            // Update UI
            this.updateUsageDisplay();
            this.closeProLogin();
            this.showTemporaryMessage('Welcome, Pro user! You now have unlimited access.', 'success');
        } else {
            this.showTemporaryMessage('Invalid credentials. Please try again.', 'error');
        }
    }
}

// Add CSS animations for temporary messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export for global use
window.NexusRankApp = NexusRankApp;
