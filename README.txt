# NexusRank Pro - The Ultimate SEO Intelligence Platform

A futuristic AI-powered SEO and writing toolkit with 12 integrated tools, cyberpunk design aesthetics, and secure DeepSeek API integration.

## 🚀 Features

### Core Tools
1. Website SEO Score Checker - Comprehensive SEO analysis
2. Keyword Suggestion Tool - Smart keyword research
3. AI SEO Writer - Generate 10K-word SEO articles
4. Paraphrasing Tool - Natural text rewriting
5. AI Detector - Detect AI-generated content
6. AI Humanizer - Make AI text sound human
7. Grammar Checker - Fix grammar and style errors
8. Plagiarism Checker - Check content originality
9. Reverse Image Search - Find image sources
10. Logo Maker - AI-powered logo generation
11. Emojis Picker - Find and copy emojis
12. Citation Generator - Generate academic citations

### Design Features
- True black (#000) background with cyberpunk aesthetics
- Neon cyan (#00ffff) and electric purple (#b967ff) accents
- Gaming-inspired UI with glowing hover effects
- JetBrains Mono font for headers, Segoe UI for body text
- Smooth animations and transitions
- Fully responsive design

### Usage System
- 2 free uses per tool (tracked via localStorage)
- Pro login system for unlimited access
- Usage limit modal with upgrade options
- Secure credential handling

## 🛠️ Deployment Instructions

### Frontend (Cloudflare Pages)
1. Fork this repository to your GitHub account
2. Connect GitHub to Cloudflare Pages
3. Select this repository for deployment
4. Set build settings:
   - Build command: (leave empty)
   - Build output directory: /
   - Root directory: /
5. Deploy the site

### Backend (Cloudflare Workers)
1. Create a new Cloudflare Worker
2. Copy the contents of `backend/worker.js` to your worker
3. Set environment variable:
   - DEEPSEEK_API_KEY: Your DeepSeek API key
4. Configure custom domain or use worker.dev subdomain
5. Update the `apiBaseUrl` in `js/app.js` to match your worker URL

### Environment Variables
- DEEPSEEK_API_KEY: Required for AI functionality (get from DeepSeek)

## 🔐 Pro Login Credentials
- Username: prouser606
- Password: tUChSUZ7drfMkYm

## 📂 File Structure
