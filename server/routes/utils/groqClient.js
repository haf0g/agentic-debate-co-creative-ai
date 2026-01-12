import Groq from 'groq-sdk';

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MAX_RETRIES = 3;

let groqClient = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groqClient;
}

/**
 * Generate content using Groq (Llama models)
 * @param {string} prompt - Text prompt
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} Generated text response
 */
export async function groqGenerateContent(prompt, options = {}) {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
    useCache = false,
    systemPrompt = null
  } = options;

  console.log(`[GROQ] Requête (model: ${model})`);

  try {
    const client = getGroqClient();
    
    const messages = [];
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    messages.push({
      role: 'user',
      content: prompt
    });

    console.log('[GROQ] Appel API Groq...');
    const startTime = Date.now();

    const response = await client.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    });

    const duration = Date.now() - startTime;
    const content = response.choices[0]?.message?.content || '';
    
    console.log(`[GROQ] Réponse reçue (${content.length} chars, ${duration}ms)`);
    
    return content;

  } catch (error) {
    console.error('[GROQ] Erreur:', error.message);
    throw error;
  }
}

/**
 * Analyze image with vision model via Groq
 * Note: Groq doesn't directly support vision, so we use text-only analysis
 * For real vision capabilities, use Gemini or other vision-capable models
 * @param {string} base64Image - Base64 encoded image
 * @param {string} prompt - Analysis prompt
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} Analysis result
 */
export async function groqAnalyzeImage(base64Image, prompt, options = {}) {
  console.log('[GROQ] Vision non supporté nativement - utilisation de Gemini recommandée');
  throw new Error('Groq ne supporte pas l\'analyse d\'images. Utilisez Gemini pour cette fonctionnalité.');
}

/**
 * Check if Groq is available and configured
 * @returns {boolean} True if Groq API key is configured
 */
export function isGroqAvailable() {
  return !!process.env.GROQ_API_KEY;
}

export default {
  groqGenerateContent,
  groqAnalyzeImage,
  isGroqAvailable
};
