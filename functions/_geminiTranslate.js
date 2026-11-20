const TRANSLATION_MODELS = [
  { model: 'gemini-4-hydrogen', thinkingLevel: 'LOW', maxAttempts: 2 },
  { model: 'gemini-3.1-flash-lite', thinkingLevel: 'MINIMAL', maxAttempts: 3 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function extractReadableError(rawMessage) {
  const trimmed = String(rawMessage || '').trim();
  const jsonStart = trimmed.indexOf('{');
  if (jsonStart !== -1) {
    try {
      const parsed = JSON.parse(trimmed.slice(jsonStart));
      if (parsed?.error?.message) return String(parsed.error.message);
      if (parsed?.message) return String(parsed.message);
    } catch {
      // ignore invalid JSON
    }
  }
  return trimmed || 'Translation failed';
}

function classifyHttpError(status, rawText) {
  const readable = extractReadableError(rawText);
  const lower = `${rawText} ${readable}`.toLowerCase();

  let retryAfterSeconds;
  const retryMatch =
    String(rawText).match(/retryDelay["']?\s*:\s*["']?(\d+)s/i) ||
    String(rawText).match(/retry in\s+(\d+)s/i);
  if (retryMatch) {
    retryAfterSeconds = Number(retryMatch[1]);
  }

  if (
    status === 403 ||
    status === 401 ||
    String(rawText).includes('PERMISSION_DENIED') ||
    String(rawText).includes('API_KEY_INVALID') ||
    lower.includes('api key not valid')
  ) {
    return {
      statusCode: status === 403 ? 403 : 400,
      code: 'AUTH_ERROR',
      message: 'Please check your Gemini API key in host environment variables.',
    };
  }

  if (
    status === 429 ||
    String(rawText).includes('"code":429') ||
    String(rawText).includes('RESOURCE_EXHAUSTED') ||
    lower.includes('quota')
  ) {
    return {
      statusCode: 429,
      code: 'QUOTA_EXHAUSTED',
      message:
        'Free tier AI translation quota has been exceeded. Please select a billing-enabled Gemini API key or try again later.',
      retryAfterSeconds,
    };
  }

  if (
    status === 503 ||
    status === 502 ||
    status === 504 ||
    status === 500 ||
    String(rawText).includes('"code":503') ||
    String(rawText).includes('UNAVAILABLE') ||
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('abort')
  ) {
    return {
      statusCode: 503,
      code: 'MODEL_UNAVAILABLE',
      message:
        'The AI translation model is currently experiencing high demand. Please try again in a few moments.',
      retryAfterSeconds: retryAfterSeconds ?? 3,
    };
  }

  return {
    statusCode: status >= 400 && status < 600 ? status : 500,
    code: 'API_ERROR',
    message: readable,
  };
}

async function callGeminiWithFallback(apiKey, buildPayload, validateParsed) {
  let lastParsedError = {
    statusCode: 500,
    code: 'API_ERROR',
    message: 'Translation failed',
  };

  for (let i = 0; i < TRANSLATION_MODELS.length; i++) {
    const { model, thinkingLevel, maxAttempts } = TRANSLATION_MODELS[i];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const body = buildPayload(thinkingLevel);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'aistudio-build',
          },
          body: JSON.stringify(body),
          signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(25000) : undefined,
        });

        const text = await res.text();
        if (res.ok) {
          const data = JSON.parse(text);
          const candidateText =
            data?.candidates?.[0]?.content?.parts
              ?.map((p) => (typeof p?.text === 'string' ? p.text : ''))
              .join('') || '';
          const cleanJson = candidateText
            .trim()
            .replace(/^```(?:json)?\s*/i, '')
            .replace(/\s*```$/i, '');
          if (!cleanJson) {
            throw new Error('Empty response from translation model');
          }
          const parsedJson = JSON.parse(cleanJson);
          if (!parsedJson || typeof parsedJson !== 'object' || Array.isArray(parsedJson)) {
            throw new Error('Invalid JSON object from translation model');
          }
          if (typeof validateParsed === 'function') {
            validateParsed(parsedJson);
          }
          return parsedJson;
        }

        const parsed = classifyHttpError(res.status, text);
        lastParsedError = parsed;

        if (parsed.code === 'AUTH_ERROR') {
          throw parsed;
        }

        if (parsed.code === 'MODEL_UNAVAILABLE') {
          if (attempt < maxAttempts) {
            const backoffMs = Math.min(3500, 800 * Math.pow(2, attempt - 1));
            await sleep(backoffMs);
            continue;
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
          break;
        }

        throw parsed;
      } catch (err) {
        if (err && typeof err === 'object' && 'statusCode' in err && 'code' in err) {
          if (err.code === 'AUTH_ERROR' || err.code === 'API_ERROR') {
            throw err;
          }
          lastParsedError = err;
        } else {
          lastParsedError = {
            statusCode: 503,
            code: 'MODEL_UNAVAILABLE',
            message: err instanceof Error ? err.message : 'Network error calling Gemini API',
          };
          if (attempt < maxAttempts) {
            await sleep(900 * attempt);
            continue;
          }
        }
      }
    }
  }

  throw lastParsedError;
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
];

export async function handleTranslateFactRequest(request, env) {
  try {
    const apiKey = env?.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        {
          error:
            'GEMINI_API_KEY is not configured on this host. Add GEMINI_API_KEY in Cloudflare Workers/Pages Environment Variables & Secrets.',
          code: 'MISSING_HOST_API_KEY',
        },
        503
      );
    }

    const body = await request.json().catch(() => null);
    const fact = body?.fact;
    const targetLanguage = body?.targetLanguage === 'ckb' ? 'ckb' : 'en';

    if (!fact || !fact.name) {
      return jsonResponse({ error: 'Missing required fact object with name.' }, 400);
    }

    const validFieldSet = new Set(ALL_TRANSLATABLE_FIELDS);
    const requestedFieldsRaw = Array.isArray(body?.fieldsToTranslate)
      ? body.fieldsToTranslate.filter((f) => typeof f === 'string' && validFieldSet.has(f))
      : [];
    const requestedFields =
      requestedFieldsRaw.length > 0 ? Array.from(new Set(requestedFieldsRaw)) : ALL_TRANSLATABLE_FIELDS;
    const requestedSet = new Set(requestedFields);
    const isPartial = requestedFields.length < ALL_TRANSLATABLE_FIELDS.length;

    const extraCaptions = Array.isArray(fact.images)
      ? fact.images.map((img) => (typeof img?.caption === 'string' ? img.caption : ''))
      : [];

    const targetLangLabel =
      targetLanguage === 'ckb' ? 'Central Kurdish (Sorani / کوردی سۆرانی)' : 'English';

    const fieldInputs = {
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

    const contextLines = [];
    if (isPartial) {
      contextLines.push('Topic reference (DO NOT output unless requested as a <FIELD>):');
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
            '7. For imagesCaptions, return an array of the exact same length as the input imagesCaptions array, translating each non-empty caption in exact order and preserving empty strings as "".',
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
            '7. For imagesCaptions, return an array of the exact same length as the input imagesCaptions array, translating each non-empty caption in exact order and preserving empty strings as "".',
          ].join('\n');

    const allSchemaProperties = {
      name: { type: 'STRING' },
      desc: { type: 'STRING' },
      fullText: { type: 'STRING' },
      additionalNotes: { type: 'STRING' },
      eraName: { type: 'STRING' },
      eraPeriod: { type: 'STRING' },
      year: { type: 'STRING' },
      century: { type: 'STRING' },
      region: { type: 'STRING' },
      imageCaption: { type: 'STRING' },
      imagesCaptions: {
        type: 'ARRAY',
        items: { type: 'STRING' },
      },
    };

    const schemaProperties = {};
    const requiredFields = [];
    for (const fieldKey of requestedFields) {
      schemaProperties[fieldKey] = allSchemaProperties[fieldKey];
      requiredFields.push(fieldKey);
    }
    if (requestedSet.has('additionalNotes')) {
      schemaProperties.notesCoherentWithTopic = { type: 'BOOLEAN' };
      schemaProperties.notesDetectedOtherSubject = { type: 'STRING' };
      requiredFields.push('notesCoherentWithTopic', 'notesDetectedOtherSubject');
    }

    const parsed = await callGeminiWithFallback(
      apiKey,
      (thinkingLevel) => ({
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: structuredInput }],
          },
        ],
        generationConfig: {
          thinkingConfig: { thinkingLevel },
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: schemaProperties,
            required: requiredFields,
          },
        },
      }),
      (data) => {
        const notesCoherent = data.notesCoherentWithTopic !== false;
        for (const fieldKey of requestedFields) {
          if (fieldKey === 'imagesCaptions') {
            if (extraCaptions.some((c) => c.trim()) && !Array.isArray(data.imagesCaptions)) {
              throw new Error('Missing imagesCaptions array');
            }
            continue;
          }
          if (fieldKey === 'additionalNotes' && !notesCoherent) continue;
          const sourceVal = String(fact[fieldKey] || '').trim();
          const outVal = typeof data[fieldKey] === 'string' ? data[fieldKey].trim() : '';
          if (sourceVal && !outVal) {
            throw new Error(`Empty translation for field "${fieldKey}"`);
          }
        }
      }
    );

    const notesExcluded =
      requestedSet.has('additionalNotes') &&
      Boolean(String(fact.additionalNotes || '').trim()) &&
      parsed.notesCoherentWithTopic === false;

    const translated = {};
    for (const fieldKey of requestedFields) {
      if (fieldKey === 'additionalNotes') {
        translated.additionalNotes = notesExcluded ? '' : parsed.additionalNotes;
      } else {
        translated[fieldKey] = parsed[fieldKey];
      }
    }

    return jsonResponse({
      translated,
      meta: {
        notesExcluded,
        notesMismatchSubject: notesExcluded
          ? String(parsed.notesDetectedOtherSubject || '').trim()
          : undefined,
      },
    });
  } catch (err) {
    const status = err?.statusCode || 500;
    return jsonResponse(
      {
        error: err?.message || 'Translation failed',
        code: err?.code || 'API_ERROR',
        ...(err?.retryAfterSeconds ? { retryAfterSeconds: err.retryAfterSeconds } : {}),
      },
      status
    );
  }
}

export async function handleTranslateCollectionRequest(request, env) {
  try {
    const apiKey = env?.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        {
          error:
            'GEMINI_API_KEY is not configured on this host. Add GEMINI_API_KEY in Cloudflare Environment Variables & Secrets.',
          code: 'MISSING_HOST_API_KEY',
        },
        503
      );
    }

    const body = await request.json().catch(() => null);
    const name = body?.name;
    const description = body?.description;
    const targetLang = body?.targetLanguage === 'ckb' ? 'ckb' : 'en';
    if (!name) {
      return jsonResponse({ error: 'Missing collection name.' }, 400);
    }

    const instructionText =
      targetLang === 'ckb'
        ? 'Translate this English historical category/collection name and short description into concise, accurate Central Kurdish (Sorani / کوردی سۆرانی).'
        : 'Translate this Kurdish Sorani historical category/collection name and short description into concise, accurate English.';

    const parsed = await callGeminiWithFallback(
      apiKey,
      (thinkingLevel) => ({
        systemInstruction: {
          parts: [
            {
              text: instructionText,
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: JSON.stringify({ name: name || '', description: description || '' }) }],
          },
        ],
        generationConfig: {
          thinkingConfig: { thinkingLevel },
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              name: { type: 'STRING' },
              description: { type: 'STRING' },
            },
            required: ['name', 'description'],
          },
        },
      }),
      (data) => {
        if (typeof data.name !== 'string' || !data.name.trim()) {
          throw new Error('Empty collection name in translation');
        }
      }
    );

    return jsonResponse({ translated: parsed });
  } catch (err) {
    const status = err?.statusCode || 500;
    return jsonResponse(
      {
        error: err?.message || 'Collection translation failed',
        code: err?.code || 'API_ERROR',
        ...(err?.retryAfterSeconds ? { retryAfterSeconds: err.retryAfterSeconds } : {}),
      },
      status
    );
  }
}
