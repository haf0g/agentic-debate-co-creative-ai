# Groq Integration Guide

## Overview

CoCreate AI Design App now supports **Groq Cloud** as an alternative LLM provider to bypass Gemini API rate limits and quota issues.

## Why Groq?

- ⚡ **Ultra-fast inference** (up to 10x faster than standard APIs)
- 🆓 **Generous free tier** (no strict daily quotas like Gemini free tier)
- 🤖 **Open-source models** (Llama 3.3 70B, Mixtral, etc.)
- 🔄 **Automatic fallback** when Gemini hits rate limits

## Supported Models

The following models are available via Groq:

- `llama-3.3-70b-versatile` (default) - Best for general tasks
- `llama-3.1-70b-versatile` - Previous generation
- `mixtral-8x7b-32768` - Mixtral model with large context
- `gemma2-9b-it` - Google's smaller open model

## Configuration

### 1. Get Your Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up / Log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the key (starts with `gsk_...`)

### 2. Add to .env File

Add or update in `c:\Users\hp\Downloads\cocreate-app\.env`:

```env
# Groq API Configuration
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
```

### 3. Restart Server

```bash
npm run dev:server
```

## How It Works

### Intent Detection (agent.js)

**Priority order:**
1. **Groq** (if `GROQ_API_KEY` is set) - Fast LLM-based detection
2. **Keyword fallback** - If Groq fails
3. **Gemini** - Disabled by default (rate limit issues)

```javascript
// Automatically uses Groq if available
const intention = await detectIntention(message, context, debateInsights, images);
```

### Image Analysis (designAnalysis.js)

**Priority order:**
1. **Gemini Vision** (required for image analysis)
2. **Groq text-only fallback** - If Gemini hits quota
   - Explains that image analysis requires Gemini
   - Provides general UX/UI guidance

```javascript
POST /api/design-analysis/analyze-base64
{
  "imageBase64": "data:image/png;base64,...",
  "mimeType": "image/png",
  "customPrompt": "Analyze this logo design"
}
```

## Features

### ✅ Bypasses Gemini Rate Limits

When you see:
```
[429 Too Many Requests] You exceeded your current quota
```

Groq automatically takes over for:
- Intent detection
- Text-based responses
- General UX/UI advice

### ✅ Fast Response Times

Groq's LPU™ architecture delivers:
- **Intent detection**: ~500ms (vs 5-10s Gemini)
- **Text generation**: 100-300 tokens/sec

### ⚠️ Limitations

- **No vision support**: Cannot analyze images directly
- **Shorter context**: 32k tokens max (vs Gemini's 128k)
- **Internet access**: No real-time web search

## Testing

### Test Intent Detection with Groq

```javascript
// In chat: "Génère un logo moderne de startup financier"
// Expected logs:
// [DEBUG] Utilisation Groq pour détection intention (rapide)
// [DEBUG] Réponse Groq reçue
// Intention détectée: { action: 'generate_image', ... }
```

### Test Image Analysis Fallback

```javascript
// In chat: "analyser ce logo" with attached image
// If Gemini quota exceeded:
// [ANALYZE-BASE64] Erreur Gemini: 429 Too Many Requests
// [ANALYZE-BASE64] Fallback vers Groq (texte seulement)...
// [ANALYZE-BASE64] Analyse Groq (texte) reçue
```

## API Usage Examples

### groqClient.js Functions

```javascript
import { groqGenerateContent, isGroqAvailable } from './utils/groqClient.js';

// Check if Groq is configured
if (isGroqAvailable()) {
  // Generate text
  const response = await groqGenerateContent(
    "Explique les principes du design UX",
    {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      maxTokens: 1000
    }
  );
  console.log(response);
}
```

### Custom System Prompts

```javascript
const response = await groqGenerateContent(
  "User message here",
  {
    systemPrompt: "You are a UX/UI design expert. Be concise and actionable.",
    temperature: 0.3
  }
);
```

## Performance Comparison

| Provider | Intent Detection | Image Analysis | Rate Limit |
|----------|------------------|----------------|------------|
| **Groq** | 500ms | ❌ No support | ~30 req/min free |
| **Gemini** | 5-10s | ✅ Vision | 20 req/day free |
| **Keyword** | <100ms | ❌ No support | Unlimited |

## Troubleshooting

### "GROQ_API_KEY not configured"

**Solution:** Add `GROQ_API_KEY=gsk_...` to your `.env` file

### Groq returns errors

**Fallback:** System automatically uses keyword detection

**Check logs:**
```
[DEBUG] Erreur Groq: <error message>
[DEBUG] Fallback vers mots-clés
```

### Image analysis not working

**Expected behavior:** Groq cannot analyze images
- System tries Gemini first
- If Gemini fails, Groq provides text-only response
- User receives explanation about needing Gemini for vision

### Rate limit on Groq

Groq free tier is generous, but if exceeded:
1. Keyword fallback activates automatically
2. Consider upgrading to Groq Pro
3. Or implement request queuing (see `geminiClient.js`)

## Advanced Configuration

### Custom Model Selection

```env
# Use faster but smaller model
GROQ_MODEL=llama-3.1-8b-instant

# Use larger context window
GROQ_MODEL=mixtral-8x7b-32768
```

### Adjust Rate Limiting

Edit `server/routes/utils/groqClient.js`:

```javascript
const MAX_RETRIES = 3; // Increase if needed
```

## Logs to Monitor

```
[GROQ] Requête (model: llama-3.3-70b-versatile)
[GROQ] Appel API Groq...
[GROQ] Réponse reçue (1234 chars, 456ms)
[GROQ] Erreur: <if any>
```

## Cost Comparison

| Provider | Free Tier | Paid Plans |
|----------|-----------|------------|
| Groq | ~14,400 req/day | $0.05-0.27 / 1M tokens |
| Gemini | 20 req/day | $0.00035 / 1K chars |

## Recommendations

1. **Keep both API keys configured:**
   - Use Groq for intent detection (fast, unlimited)
   - Use Gemini for image analysis (vision required)

2. **Monitor usage:**
   - Check Groq console: https://console.groq.com/
   - Check Gemini usage: https://ai.dev/rate-limit

3. **Fallback strategy:**
   ```
   Groq → Keyword → Gemini (disabled)
   ```

## Support

- **Groq Documentation:** https://console.groq.com/docs
- **Model Comparison:** https://console.groq.com/docs/models
- **Rate Limits:** https://console.groq.com/docs/rate-limits

---

**Integration Status:** ✅ Active  
**Last Updated:** January 11, 2026  
**Version:** 1.0.0
