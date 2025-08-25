# NexusRank Pro - Production Deployment

## Frontend URLs
- **Production**: `https://nexusrank-pro.pages.dev`
- **Backend Worker**: `https://nexusrank-ai.shahshameer383.workers.dev`

## Deployment Instructions

### 1. Frontend Deployment (Cloudflare Pages)
1. Push this entire folder to your GitHub repository
2. Connect repository to Cloudflare Pages
3. Deploy automatically from main branch

### 2. Backend Deployment (Cloudflare Workers)
```bash
cd backend
wrangler publish
```

### 3. Environment Variables
Set in Cloudflare Workers dashboard:
- `DEEPSEEK_API_KEY`: Your DeepSeek API key

## Features
- ✅ 12 Advanced SEO & Writing Tools  
- ✅ Real DeepSeek AI Integration
- ✅ Free Usage Tracking (2 uses per tool)
- ✅ Pro Login System (prouser606/tUChSUZ7drfMkYm)
- ✅ Google AdSense Ready
- ✅ Complete Legal Pages
- ✅ Mobile Responsive Navigation
- ✅ Cyberpunk Gaming Design

## Pro Credentials
- Username: `prouser606`
- Password: `tUChSUZ7drfMkYm`

## File Structure
```
nexusrank-pro/
├── index.html          # Main application
├── css/style.css       # Cyberpunk styling
├── js/app.js          # Core functionality
├── sw.js              # Service worker
├── backend/           # Cloudflare Worker
│   ├── worker.js     # API proxy
│   └── wrangler.jsonc # Deploy config
└── pages/            # Legal pages
    ├── privacy.html
    ├── terms.html
    ├── about.html
    ├── contact.html
    └── cookie-policy.html
```

## AI Tools Available
1. Website SEO Score Checker
2. Keyword Suggestion Tool
3. AI SEO Writer (10K+ words)
4. Paraphrasing Tool
5. AI Detector
6. AI Humanizer
7. Grammar Checker
8. Plagiarism Checker
9. Reverse Image Search
10. Logo Maker
11. Emojis Picker
12. Citation Generator

All tools use real DeepSeek API for professional-grade results.