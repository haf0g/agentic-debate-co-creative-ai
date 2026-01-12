import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const REQUESTS_PER_MINUTE = Number.parseInt(process.env.GEMINI_REQUESTS_PER_MINUTE || '5', 10);
const MIN_INTERVAL_MS = Math.ceil(60_000 / Math.max(1, REQUESTS_PER_MINUTE));

const MAX_RETRIES = Number.parseInt(process.env.GEMINI_MAX_RETRIES || '3', 10);
const CACHE_TTL_MS = Number.parseInt(process.env.GEMINI_CACHE_TTL_MS || '60000', 10);
const MAX_QUEUE_BEFORE_FALLBACK = Number.parseInt(process.env.GEMINI_MAX_QUEUE_BEFORE_FALLBACK || '3', 10);

let genAI = null;
const modelCache = new Map();

let queueTail = Promise.resolve();
let pendingCount = 0;
let lastStartMs = 0;

const memoryCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function getModel(modelName = DEFAULT_MODEL) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  if (!modelCache.has(modelName)) {
    modelCache.set(modelName, genAI.getGenerativeModel({ model: modelName }));
  }
  return modelCache.get(modelName);
}

function parseRetryAfterMs(error) {
  // Node SDK error shapes vary; handle best-effort parsing.
  const message = String(error?.message || '');
  const match = message.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
  if (match) {
    const seconds = Number.parseFloat(match[1]);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.ceil(seconds * 1000);
    }
  }

  // Some errors include a structured payload under `error`.
  const details = error?.error?.details;
  if (Array.isArray(details)) {
    const retryInfo = details.find((d) => d && d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
    const retryDelay = retryInfo?.retryDelay;
    if (typeof retryDelay === 'string') {
      const s = retryDelay.match(/^(\d+)s$/);
      if (s) return Number.parseInt(s[1], 10) * 1000;
    }
  }

  return null;
}

function isRateLimitError(error) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('429') || msg.includes('resource_exhausted') || msg.includes('quota exceeded');
}

function cacheGet(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  if (CACHE_TTL_MS <= 0) return;
  memoryCache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function makeCacheKey(modelName, input) {
  // Cache only for pure string prompts to avoid hashing large binary payloads.
  if (typeof input === 'string') {
    return sha256(`${modelName}|text|${input}`);
  }
  return null;
}

export function geminiQueueStats() {
  return {
    pending: pendingCount,
    minIntervalMs: MIN_INTERVAL_MS,
    maxQueueBeforeFallback: MAX_QUEUE_BEFORE_FALLBACK,
    requestsPerMinute: REQUESTS_PER_MINUTE,
  };
}

export function shouldBypassGemini() {
  return pendingCount >= MAX_QUEUE_BEFORE_FALLBACK;
}

export async function geminiGenerateContent(input, options = {}) {
  const {
    model: modelName = DEFAULT_MODEL,
    cache = true,
  } = options;

  console.log(`[GEMINI] Requête (pending: ${pendingCount}, model: ${modelName}, cache: ${cache})`);

  const cacheKey = cache ? makeCacheKey(modelName, input) : null;
  if (cacheKey) {
    const cached = cacheGet(cacheKey);
    if (cached) {
      console.log('[GEMINI] Cache hit');
      return cached;
    }
  }

  pendingCount += 1;
  console.log(`[GEMINI] File d'attente +1 (total: ${pendingCount})`);

  const run = queueTail
    .catch(() => undefined)
    .then(async () => {
      const now = Date.now();
      const waitMs = Math.max(0, lastStartMs + MIN_INTERVAL_MS - now);
      if (waitMs > 0) {
        console.log(`[GEMINI] Attente rate limit: ${waitMs}ms`);
        await sleep(waitMs);
      }
      lastStartMs = Date.now();

      const model = getModel(modelName);
      console.log('[GEMINI] Appel API Gemini...');

      let attempt = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const result = await model.generateContent(input);
          const text = result?.response?.text?.() ?? '';
          const trimmed = String(text).trim();
          console.log(`[GEMINI] Réponse reçue (${trimmed.length} chars)`);
          if (cacheKey && trimmed) cacheSet(cacheKey, trimmed);
          return trimmed;
        } catch (error) {
          attempt += 1;
          console.error(`[GEMINI] Erreur tentative ${attempt}:`, error.message);

          if (isRateLimitError(error) && attempt <= MAX_RETRIES) {
            const retryAfterMs = parseRetryAfterMs(error) ?? MIN_INTERVAL_MS;
            const jitterMs = Math.floor(Math.random() * 250);
            console.log(`[GEMINI] Rate limit, retry dans ${retryAfterMs + jitterMs}ms`);
            await sleep(retryAfterMs + jitterMs);
            continue;
          }

          console.error('[GEMINI] Échec définitif:', error);
          throw error;
        }
      }
    })
    .finally(() => {
      pendingCount -= 1;
      console.log(`[GEMINI] File d'attente -1 (total: ${pendingCount})`);
    });

  // Keep the queue alive even if this request fails.
  queueTail = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}
