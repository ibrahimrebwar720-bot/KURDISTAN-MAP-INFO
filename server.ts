import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 15000,
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ParsedGeminiError {
  statusCode: number;
  code: 'QUOTA_EXHAUSTED' | 'MODEL_UNAVAILABLE' | 'AUTH_ERROR' | 'API_ERROR';
  message: string;
  retryAfterSeconds?: number;
}

function extractReadableGeminiMessage(rawMessage: string): string {
  const trimmed = (rawMessage || '').trim();
  const jsonStart = trimmed.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart)) as {
        error?: { message?: string };
        message?: string;
      };
      if (parsed?.error?.message) return String(parsed.error.message);
      if (parsed?.message) return String(parsed.message);
    } catch {
      // ignore invalid JSON wrapper
    }
  }
  return trimmed || 'Translation failed';
}

function parseGeminiApiError(err: unknown): ParsedGeminiError {
  const rawMessage = err instanceof Error ? err.message : String(err || 'Translation failed');
  const readableMessage = extractReadableGeminiMessage(rawMessage);
  const lowerMsg = `${rawMessage} ${readableMessage}`.toLowerCase();
  const statusProp =
    typeof err === 'object' && err !== null && 'status' in err
      ? Number((err as { status?: unknown }).status)
      : NaN;

  let retryAfterSeconds: number | undefined;
  const retryMatch =
    rawMessage.match(/retryDelay["']?\s*:\s*["']?(\d+)s/i) ||
    rawMessage.match(/retry in\s+(\d+)s/i);
  if (retryMatch) {
    retryAfterSeconds = Number(retryMatch[1]);
  }

  const isAuth =
    statusProp === 403 ||
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('GEMINI_API_KEY is not configured');

  if (isAuth) {
    return {
      statusCode: statusProp === 403 ? 403 : 400,
      code: 'AUTH_ERROR',
      message: 'Please check your Gemini API key in Settings > Secrets.',
    };
  }

  const isQuota =
    statusProp === 429 ||
    rawMessage.includes('"code":429') ||
    rawMessage.includes('RESOURCE_EXHAUSTED') ||
    lowerMsg.includes('quota');

  if (isQuota) {
    return {
      statusCode: 429,
      code: 'QUOTA_EXHAUSTED',
      message:
        'Free tier AI translation quota has been exceeded. Please select a billing-enabled Gemini API key in Settings > Secrets or try again later.',
      retryAfterSeconds,
    };
  }

  const isUnavailable =
    statusProp === 503 ||
    statusProp === 502 ||
    statusProp === 504 ||
    statusProp === 500 ||
    rawMessage.includes('"code":503') ||
    rawMessage.includes('UNAVAILABLE') ||
    lowerMsg.includes('high demand') ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('temporarily unavailable') ||
    lowerMsg.includes('service unavailable') ||
    lowerMsg.includes('try again later') ||
    lowerMsg.includes('econnreset') ||
    lowerMsg.includes('etimedout') ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('timed out') ||
    lowerMsg.includes('abort') ||
    lowerMsg.includes('fetch failed');

  if (isUnavailable) {
    return {
      statusCode: 503,
      code: 'MODEL_UNAVAILABLE',
      message:
        'The AI translation model is currently experiencing high demand. Please try again in a few moments.',
      retryAfterSeconds: retryAfterSeconds ?? 3,
    };
  }

  return {
    statusCode: Number.isFinite(statusProp) && statusProp >= 400 && statusProp < 600 ? statusProp : 500,
    code: 'API_ERROR',
    message: readableMessage,
  };
}

const TRANSLATION_MODELS: Array<{ model: string; thinkingLevel: ThinkingLevel; maxAttempts: number }> = [
  { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW, maxAttempts: 2 },
  { model: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL, maxAttempts: 3 },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateTranslationWithFallback(
  ai: GoogleGenAI,
  buildRequest: (model: string, thinkingLevel: ThinkingLevel) => Parameters<GoogleGenAI['models']['generateContent']>[0]
) {
  let lastError: unknown;

  for (let i = 0; i < TRANSLATION_MODELS.length; i++) {
    const { model, thinkingLevel, maxAttempts } = TRANSLATION_MODELS[i];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await ai.models.generateContent(buildRequest(model, thinkingLevel));
      } catch (err) {
        lastError = err;
        const parsed = parseGeminiApiError(err);

        if (parsed.code === 'AUTH_ERROR') {
          throw err;
        }

        if (parsed.code === 'MODEL_UNAVAILABLE') {
          if (attempt < maxAttempts) {
            const backoffMs = Math.min(4000, 900 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 350));
            console.warn(
              `Gemini model "${model}" temporarily unavailable (503). Retrying attempt ${attempt + 1}/${maxAttempts} in ${backoffMs}ms...`
            );
            await sleep(backoffMs);
            continue;
          }
          // Exhausted retries for this model; move to next fallback model if available
          if (i < TRANSLATION_MODELS.length - 1) {
            console.warn(
              `Gemini model "${model}" stayed busy (503). Falling back to "${TRANSLATION_MODELS[i + 1].model}"...`
            );
          }
          break;
        }

        if (parsed.code === 'QUOTA_EXHAUSTED') {
          if (
            attempt === 1 &&
            parsed.retryAfterSeconds &&
            parsed.retryAfterSeconds > 0 &&
            parsed.retryAfterSeconds <= 10
          ) {
            await sleep(parsed.retryAfterSeconds * 1000 + 250);
            continue;
          }
          // Move immediately to next model in TRANSLATION_MODELS
          break;
        }

        throw err;
      }
    }
  }

  throw lastError;
}

const ALL_TRANSLATABLE_FIELDS = [
  'name',
  'desc',
  'fullText',
  'additionalNotes',
  'eraName',
  'eraPeriod',
  'year',
  'century',
  'region',
  'imageCaption',
  'imagesCaptions',
] as const;

type TranslatableFieldName = (typeof ALL_TRANSLATABLE_FIELDS)[number];

interface TranslateFactRequestBody {
  targetLanguage?: 'en' | 'ckb';
  fieldsToTranslate?: string[];
  fact?: {
    id?: number;
    name?: string;
    desc?: string;
    fullText?: string;
    additionalNotes?: string;
    eraName?: string;
    eraPeriod?: string;
    year?: string;
    century?: string;
    region?: string;
    imageCaption?: string;
    images?: Array<{ url?: string; caption?: string }>;
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'kurdistan-info-map-server' });
  });

  app.post('/api/translate-fact', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as TranslateFactRequestBody;
      const fact = body.fact;
      const targetLanguage: 'en' | 'ckb' = body.targetLanguage === 'ckb' ? 'ckb' : 'en';

      if (!fact || !fact.name) {
        res.status(400).json({ error: 'Missing required fact object with name.' });
        return;
      }

      const validFieldSet = new Set<string>(ALL_TRANSLATABLE_FIELDS);
      const requestedFieldsRaw = Array.isArray(body.fieldsToTranslate)
        ? body.fieldsToTranslate.filter((f): f is TranslatableFieldName => typeof f === 'string' && validFieldSet.has(f))
        : [];
      const requestedFields: readonly TranslatableFieldName[] =
        requestedFieldsRaw.length > 0 ? Array.from(new Set(requestedFieldsRaw)) : ALL_TRANSLATABLE_FIELDS;
      const requestedSet = new Set<TranslatableFieldName>(requestedFields);
      const isPartial = requestedFields.length < ALL_TRANSLATABLE_FIELDS.length;

      const ai = createGeminiClient();
      const extraCaptions = Array.isArray(fact.images)
        ? fact.images.map((img) => (typeof img?.caption === 'string' ? img.caption : ''))
        : [];

      const targetLangLabel = targetLanguage === 'ckb' ? 'Central Kurdish (Sorani / کوردی سۆرانی)' : 'English';

      const fieldInputs: Record<TranslatableFieldName, string> = {
        name: `<FIELD name="name">${fact.name || ''}</FIELD>`,
        desc: `<FIELD name="desc">${fact.desc || ''}</FIELD>`,
        fullText: `<FIELD name="fullText">${fact.fullText || ''}</FIELD>`,
        additionalNotes: `<FIELD name="additionalNotes">${fact.additionalNotes || ''}</FIELD>`,
        eraName: `<FIELD name="eraName">${fact.eraName || ''}</FIELD>`,
        eraPeriod: `<FIELD name="eraPeriod">${fact.eraPeriod || ''}</FIELD>`,
        year: `<FIELD name="year">${fact.year || ''}</FIELD>`,
        century: `<FIELD name="century">${fact.century || ''}</FIELD>`,
        region: `<FIELD name="region">${fact.region || ''}</FIELD>`,
        imageCaption: `<FIELD name="imageCaption">${fact.imageCaption || ''}</FIELD>`,
        imagesCaptions: `<FIELD name="imagesCaptions">${JSON.stringify(extraCaptions)}</FIELD>`,
      };

      const contextLines: string[] = [];
      if (isPartial) {
        contextLines.push(`Topic reference (DO NOT output unless requested as a <FIELD>):`);
        if (!requestedSet.has('name')) {
          contextLines.push(`<CONTEXT name="topicName">${fact.name || ''}</CONTEXT>`);
        }
        if (requestedSet.has('additionalNotes') && !requestedSet.has('fullText') && fact.fullText) {
          contextLines.push(`<CONTEXT name="topicFullText">${fact.fullText}</CONTEXT>`);
        }
      }

      const structuredInput = [
        `Translate EACH <FIELD> below independently and strictly into ${targetLangLabel}.`,
        'NEVER mix content from one field into another field, NEVER pull information from memory about a different topic, and NEVER alter the subject.',
        ...contextLines,
        '',
        ...requestedFields.map((fieldKey) => fieldInputs[fieldKey]),
      ].join('\n');

      const systemInstruction =
        targetLanguage === 'ckb'
          ? [
              'You are an expert academic historian and strict translator specializing in Kurdish, Mesopotamian, Zagros, and Middle Eastern history.',
              'Translate the provided English historical encyclopedia fields into clear, accurate, eloquent Central Kurdish (Sorani / کوردی سۆرانی).',
              'CRITICAL RULES:',
              '1. STRICT 1-TO-1 FIELD FIDELITY: Each output field MUST be a faithful Central Kurdish (Sorani) translation of ONLY its corresponding <FIELD> input. Never invent facts, never insert details from external memory, and never bleed text from one field into another.',
              '2. SUBJECT COHERENCE CHECK ON additionalNotes (when additionalNotes is requested): Check whether the <FIELD name="additionalNotes"> text genuinely belongs to the same historical person, place, dynasty, or event as the topic name/context. If additionalNotes is empty, set notesCoherentWithTopic=true and notesDetectedOtherSubject="". If additionalNotes is unmistakably pasted by mistake from a completely different, unrelated historical subject, set notesCoherentWithTopic=false, put the short name of that unrelated subject in notesDetectedOtherSubject, and set additionalNotes to "" in the output.',
              '3. Convert Western digits (0123456789) into Kurdish/Eastern numerals (٠١٢٣٤٥٦٧٨٩) in Kurdish date/number strings where natural.',
              '4. Convert "BCE" / "BC" to "پ.ز" (پێش زایین) and "CE" / "AD" to "ز" (زایینی). Format centuries naturally in Kurdish Sorani (e.g., "سەدەی ١٢ی زایینی", "سەدەی ٧ی پ.ز"). For extreme prehistoric times older than 4000 BCE (such as "Paleolithic / Prehistoric Era" or 70,000 - 30,000 BCE), format century naturally as "سەردەمی بەردین / پێش‌مێژوو".',
              '5. Use established Kurdish historical orthography for cities and dynasties (e.g., هەولێر، سلێمانی، ئامەد، ئەردەڵان، بابان، سۆران، بادینان، بۆتان، ماد، حەسەنوەیهی، مەروانی، شەدادی، ئەیوبی، ئەشکەوتی شانەدەر).',
              '6. If an input field is empty, return an empty string "" for that field.',
              '7. For imagesCaptions (when requested), return an array of the exact same length as the input imagesCaptions array, translating each non-empty caption in exact order and preserving empty strings as "".',
            ].join('\n')
          : [
              'You are an expert academic historian and strict translator specializing in Kurdish, Mesopotamian, Zagros, and Middle Eastern history.',
              'Translate the provided Central Kurdish (Sorani) historical encyclopedia fields into clear, accurate, scholarly English.',
              'CRITICAL RULES:',
              '1. STRICT 1-TO-1 FIELD FIDELITY: Each output field MUST be a faithful English translation of ONLY its corresponding <FIELD> input. Never invent facts, never insert details from external memory, and never bleed text from one field into another.',
              '2. SUBJECT COHERENCE CHECK ON additionalNotes (when additionalNotes is requested): Check whether the <FIELD name="additionalNotes"> text genuinely belongs to the same historical person, place, dynasty, or event as the topic name/context. If additionalNotes is empty, set notesCoherentWithTopic=true and notesDetectedOtherSubject="". If additionalNotes is unmistakably pasted by mistake from a completely different, unrelated historical subject (e.g., discussing Emir Daysam of Azerbaijan when the entry is Shanidar Cave, or discussing poet Besarani when the entry is an Ardalan governor), set notesCoherentWithTopic=false, put the short English name of that unrelated subject in notesDetectedOtherSubject, and set additionalNotes to "" in the output.',
              '3. Convert Kurdish/Eastern numerals (٠١٢٣٤٥٦٧٨٩) into standard Western Arabic numerals (0123456789).',
              '4. Convert "پ.ز" / "پێش زایین" to "BCE" and "ز" / "زایینی" to "CE". Format centuries naturally (e.g., "12th Century CE", "7th Century BCE"). For extreme prehistoric times older than 4000 BCE (such as 70,000 - 30,000 BCE or "سەدەی ٧٠٠ی پێش زایین"), format century naturally as "Paleolithic / Prehistoric Era" instead of "700th Century BCE".',
              '5. Use established English historical orthography for Kurdish entities and cities (e.g. Erbil, Sulaymaniyah, Amed / Diyarbakir, Ardalan, Baban, Soran, Badinan, Bohtan, Medes, Hasanwayhids, Marwanids, Shaddadids, Ayyubids, Shanidar Cave).',
              '6. If an input field is empty, return an empty string "" for that field.',
              '7. For imagesCaptions (when requested), return an array of the exact same length as the input imagesCaptions array, translating each non-empty caption in exact order and preserving empty strings as "".',
            ].join('\n');

      const allSchemaProperties: Record<string, { type: Type; description?: string; items?: { type: Type } }> = {
        name: { type: Type.STRING, description: `Faithful ${targetLangLabel} translation of input name` },
        desc: { type: Type.STRING, description: `Faithful ${targetLangLabel} translation of input desc` },
        fullText: { type: Type.STRING, description: `Faithful ${targetLangLabel} translation of ONLY input fullText` },
        additionalNotes: { type: Type.STRING, description: `Faithful ${targetLangLabel} translation of ONLY input additionalNotes, or "" if notesCoherentWithTopic is false` },
        eraName: { type: Type.STRING, description: `${targetLangLabel} era name` },
        eraPeriod: { type: Type.STRING, description: `${targetLangLabel} era period string` },
        year: { type: Type.STRING, description: `${targetLangLabel} formatted year or date span` },
        century: { type: Type.STRING, description: `Natural ${targetLangLabel} formatted century or prehistoric era` },
        region: { type: Type.STRING, description: `${targetLangLabel} region / province name` },
        imageCaption: { type: Type.STRING, description: `${targetLangLabel} caption for primary image` },
        imagesCaptions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: `${targetLangLabel} captions matching input imagesCaptions length in exact order`,
        },
      };

      const schemaProperties: Record<string, { type: Type; description?: string; items?: { type: Type } }> = {};
      const requiredFields: string[] = [];

      for (const fieldKey of requestedFields) {
        schemaProperties[fieldKey] = allSchemaProperties[fieldKey];
        requiredFields.push(fieldKey);
      }

      if (requestedSet.has('additionalNotes')) {
        schemaProperties.notesCoherentWithTopic = {
          type: Type.BOOLEAN,
          description: 'True if additionalNotes is empty or belongs to the same subject as name/context; false only if additionalNotes is unmistakably from a completely unrelated topic',
        };
        schemaProperties.notesDetectedOtherSubject = {
          type: Type.STRING,
          description: 'Short name of the unrelated subject if notesCoherentWithTopic is false, otherwise ""',
        };
        requiredFields.push('notesCoherentWithTopic', 'notesDetectedOtherSubject');
      }

      const response = await generateTranslationWithFallback(ai, (model, thinkingLevel) => ({
        model,
        contents: structuredInput,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: schemaProperties,
            required: requiredFields,
          },
        },
      }));

      const rawText = (response.text || '{}')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '');
      const parsed = JSON.parse(rawText);
      const notesExcluded =
        requestedSet.has('additionalNotes') &&
        Boolean((fact.additionalNotes || '').trim()) &&
        parsed.notesCoherentWithTopic === false;

      const translated: Record<string, unknown> = {};
      for (const fieldKey of requestedFields) {
        if (fieldKey === 'additionalNotes') {
          translated.additionalNotes = notesExcluded ? '' : parsed.additionalNotes;
        } else {
          translated[fieldKey] = parsed[fieldKey];
        }
      }

      res.json({
        translated,
        meta: {
          notesExcluded,
          notesMismatchSubject: notesExcluded ? String(parsed.notesDetectedOtherSubject || '').trim() : undefined,
        },
      });
    } catch (err: unknown) {
      const parsedErr = parseGeminiApiError(err);
      if (parsedErr.code === 'QUOTA_EXHAUSTED') {
        console.warn('Gemini /api/translate-fact quota exhausted (429).');
      } else if (parsedErr.code === 'MODEL_UNAVAILABLE') {
        console.warn('Gemini /api/translate-fact temporarily unavailable (503) across fallback models.');
      } else {
        console.error('Gemini /api/translate-fact error:', parsedErr.message);
      }
      res.status(parsedErr.statusCode).json({
        error: parsedErr.message,
        code: parsedErr.code,
        ...(parsedErr.retryAfterSeconds ? { retryAfterSeconds: parsedErr.retryAfterSeconds } : {}),
      });
    }
  });

  app.post('/api/translate-collection', async (req: Request, res: Response) => {
    try {
      const { name, description, targetLanguage } = (req.body || {}) as {
        name?: string;
        description?: string;
        targetLanguage?: 'en' | 'ckb';
      };
      if (!name) {
        res.status(400).json({ error: 'Missing collection name.' });
        return;
      }

      const targetLang: 'en' | 'ckb' = targetLanguage === 'ckb' ? 'ckb' : 'en';
      const systemInstruction =
        targetLang === 'ckb'
          ? 'Translate this English historical category/collection name and short description into concise, accurate Central Kurdish (Sorani / کوردی سۆرانی).'
          : 'Translate this Kurdish Sorani historical category/collection name and short description into concise, accurate English.';

      const ai = createGeminiClient();
      const response = await generateTranslationWithFallback(ai, (model, thinkingLevel) => ({
        model,
        contents: JSON.stringify({ name: name || '', description: description || '' }),
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ['name', 'description'],
          },
        },
      }));

      const rawCollectionText = (response.text || '{}')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '');
      const parsed = JSON.parse(rawCollectionText);
      res.json({ translated: parsed });
    } catch (err: unknown) {
      const parsedErr = parseGeminiApiError(err);
      if (parsedErr.code === 'QUOTA_EXHAUSTED') {
        console.warn('Gemini /api/translate-collection quota exhausted (429).');
      } else if (parsedErr.code === 'MODEL_UNAVAILABLE') {
        console.warn('Gemini /api/translate-collection temporarily unavailable (503) across fallback models.');
      } else {
        console.error('Gemini /api/translate-collection error:', parsedErr.message);
      }
      res.status(parsedErr.statusCode).json({
        error: parsedErr.message,
        code: parsedErr.code,
        ...(parsedErr.retryAfterSeconds ? { retryAfterSeconds: parsedErr.retryAfterSeconds } : {}),
      });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    // Fallback index.html serving via Vite transformIndexHtml if custom routes hit directly
    app.use('*', async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        next();
        return;
      }
      try {
        const fs = await import('fs/promises');
        const htmlPath = path.resolve(process.cwd(), 'index.html');
        let template = await fs.readFile(htmlPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.all('/api/*', (_req: Request, res: Response) => {
      res.status(404).json({ error: 'API route not found' });
    });
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
