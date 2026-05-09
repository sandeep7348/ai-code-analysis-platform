const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const Analysis = require('../src/models/Analysis');
const logger = require('../src/middleware/logger');
const { optionalAuth } = require('../src/middleware/auth');
const { getCache, setCache } = require('../src/middleware/redis');
const {
  aiAnalysisTotal,
  aiAnalysisDuration,
  cacheHits,
  cacheMisses,
  mongodbOperations
} = require('../src/metrics/prometheus');

const router = express.Router();

// ─── OpenRouter helper (OpenAI-compatible) ────────────────────
const OR_BASE  = process.env.OR_BASE  || 'https://openrouter.ai/api/v1';
const OR_MODEL = process.env.OR_MODEL || 'openrouter/auto';
const OR_API_KEY = process.env.OR_API_KEY;

if (!OR_API_KEY) {
  logger.warn('WARNING: OR_API_KEY environment variable is not set. Analysis requests will fail.');
}

async function orChat({ system, messages, max_tokens = 1500 }) {
  if (!OR_API_KEY) {
    throw new Error('OpenRouter API key is not configured. Set OR_API_KEY environment variable.');
  }

  const body = {
    model: OR_MODEL,
    max_tokens,
    messages: system
      ? [{ role: 'system', content: system }, ...messages]
      : messages,
  };

  const res = await fetch(`${OR_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OR_API_KEY}`,
      'HTTP-Referer': 'https://codelens-ai.app',  // optional but polite
      'X-Title': 'CodeLens AI',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }

  const data = await res.json();
  const choice = data.choices?.[0];
  const rawText = choice?.message?.content || '';
  const tokensUsed = data.usage?.completion_tokens || 0;
  return { rawText, tokensUsed };
}

const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many analysis requests. Please wait a moment.' }
});

const MODES = {
  review: (code, lang) => ({
    system: `You are an expert ${lang} code reviewer. Always respond with valid JSON only.`,
    user: `Review this ${lang} code and return JSON:
{
  "score": <0-100>,
  "summary": "<one-line>",
  "issues": [{"title":"...","detail":"...","severity":"high|medium|low"}],
  "positives": ["..."],
  "suggestions": ["..."],
  "metrics": {"complexity":"low|medium|high","readability":<1-10>,"testability":<1-10>}
}
Code:\n\`\`\`${lang}\n${code}\n\`\`\``
  }),
  explain: (code, lang) => ({
    system: `You are a senior ${lang} developer and teacher.`,
    user: `Explain this ${lang} code clearly. Cover: what it does, how it works step-by-step, and key concepts used.\n\`\`\`${lang}\n${code}\n\`\`\``
  }),
  refactor: (code, lang) => ({
    system: `You are an expert ${lang} developer focused on clean code.`,
    user: `Refactor this ${lang} code for quality, readability, and performance. Show the improved code and list all changes made.\n\`\`\`${lang}\n${code}\n\`\`\``
  }),
  test: (code, lang) => ({
    system: `You are a ${lang} testing expert.`,
    user: `Write comprehensive unit tests for this ${lang} code. Include happy path, edge cases, and error cases. Use standard testing conventions.\n\`\`\`${lang}\n${code}\n\`\`\``
  })
};

// POST /api/analyze
router.post('/',
  analyzeLimiter,
  optionalAuth,
  [
    body('code').notEmpty().isLength({ max: 50000 }).withMessage('Code must be 1–50000 characters'),
    body('mode').isIn(['review', 'explain', 'refactor', 'test']),
    body('language').notEmpty().isLength({ max: 50 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { code, mode, language } = req.body;
    const codeHash = crypto.createHash('sha256').update(`${code}:${mode}:${language}`).digest('hex');
    const cacheKey = `analysis:${codeHash}`;
    const startTime = Date.now();

    // Cache check
    const cached = await getCache(cacheKey);
    if (cached) {
      cacheHits.inc({ cache_type: 'analysis' });
      aiAnalysisTotal.inc({ mode, language, status: 'cache_hit' });
      logger.info(`Cache HIT for ${mode}/${language}`);
      return res.json({ ...cached, cached: true });
    }
    cacheMisses.inc({ cache_type: 'analysis' });

    const timer = aiAnalysisDuration.startTimer({ mode, language });

    try {
      const { system, user } = MODES[mode](code, language);
      const { rawText, tokensUsed } = await orChat({
        system,
        messages: [{ role: 'user', content: user }],
        max_tokens: 1500,
      });
      timer();

      let result;
      if (mode === 'review') {
        try {
          result = JSON.parse(rawText.replace(/```json|```/g, '').trim());
        } catch {
          result = { text: rawText };
        }
      } else {
        result = { text: rawText };
      }

      const durationMs = Date.now() - startTime;
      const payload = { result, mode, language, durationMs, tokensUsed };

      // Save to MongoDB
      const analysis = await Analysis.create({
        userId: req.user?.id,
        sessionId: req.headers['x-session-id'],
        mode,
        language,
        codeHash,
        codeSnippet: code,
        result,
        tokensUsed: payload.tokensUsed,
        durationMs,
        score: result.score || null
      });
      mongodbOperations.inc({ operation: 'insert', collection: 'analyses' });

      // Cache for 1 hour
      await setCache(cacheKey, payload, 3600);

      aiAnalysisTotal.inc({ mode, language, status: 'success' });
      logger.info(`Analysis complete: ${mode}/${language} in ${durationMs}ms`);

      res.json({ ...payload, id: analysis._id, cached: false });
    } catch (err) {
      timer();
      aiAnalysisTotal.inc({ mode, language, status: 'error' });
      logger.error(`Analysis failed: ${err.message}`);
      res.status(502).json({ error: 'AI analysis failed. Please try again.' });
    }
  }
);

// POST /api/analyze/chat — follow-up questions
router.post('/chat',
  analyzeLimiter,
  optionalAuth,
  [
    body('question').notEmpty().isLength({ max: 500 }),
    body('history').isArray({ max: 20 }),
    body('language').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { question, history, language } = req.body;
    try {
      const messages = [
        ...history.map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: question }
      ];

      const { rawText: answer, tokensUsed } = await orChat({
        system: `You are an expert ${language} developer helping with code questions. Be concise and precise.`,
        messages,
        max_tokens: 800,
      });

      res.json({ answer, tokensUsed });
    } catch (err) {
      logger.error(`Chat error: ${err.message}`);
      res.status(502).json({ error: 'Chat request failed' });
    }
  }
);

module.exports = router;
