import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

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
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface TranslateFactRequestBody {
  targetLanguage?: 'en' | 'ckb';
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

      const ai = createGeminiClient();
      const extraCaptions = Array.isArray(fact.images)
        ? fact.images.map((img) => (typeof img?.caption === 'string' ? img.caption : ''))
        : [];

      const targetLangLabel = targetLanguage === 'ckb' ? 'Central Kurdish (Sorani / کوردی سۆرانی)' : 'English';

      const structuredInput = [
        `Translate EACH field below independently and strictly into ${targetLangLabel}.`,
        'NEVER mix content from one field into another field, NEVER pull information from memory about a different topic, and NEVER alter the subject.',
        '',
        `<FIELD name="name">${fact.name || ''}</FIELD>`,
        `<FIELD name="desc">${fact.desc || ''}</FIELD>`,
        `<FIELD name="fullText">${fact.fullText || ''}</FIELD>`,
        `<FIELD name="additionalNotes">${fact.additionalNotes || ''}</FIELD>`,
        `<FIELD name="eraName">${fact.eraName || ''}</FIELD>`,
        `<FIELD name="eraPeriod">${fact.eraPeriod || ''}</FIELD>`,
        `<FIELD name="year">${fact.year || ''}</FIELD>`,
        `<FIELD name="century">${fact.century || ''}</FIELD>`,
        `<FIELD name="region">${fact.region || ''}</FIELD>`,
        `<FIELD name="imageCaption">${fact.imageCaption || ''}</FIELD>`,
        `<FIELD name="imagesCaptions">${JSON.stringify(extraCaptions)}</FIELD>`,
      ].join('\n');

      const systemInstruction =
        targetLanguage === 'ckb'
          ? [
              'You are an expert academic historian and strict translator specializing in Kurdish, Mesopotamian, Zagros, and Middle Eastern history.',
              'Translate the provided English historical encyclopedia fields into clear, accurate, eloquent Central Kurdish (Sorani / کوردی سۆرانی).',
              'CRITICAL RULES:',
              '1. STRICT 1-TO-1 FIELD FIDELITY: Each output field MUST be a faithful Central Kurdish (Sorani) translation of ONLY its corresponding <FIELD> input. Never invent facts, never insert details from external memory, and never bleed text from one field into another.',
              '2. SUBJECT COHERENCE CHECK ON additionalNotes: Check whether the <FIELD name="additionalNotes"> text genuinely belongs to the same historical person, place, dynasty, or event as <FIELD name="name"> and <FIELD name="fullText">. If additionalNotes is empty, set notesCoherentWithTopic=true and notesDetectedOtherSubject="". If additionalNotes is unmistakably pasted by mistake from a completely different, unrelated historical subject, set notesCoherentWithTopic=false, put the short name of that unrelated subject in notesDetectedOtherSubject, and set additionalNotes to "" in the output.',
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
              '2. SUBJECT COHERENCE CHECK ON additionalNotes: Check whether the <FIELD name="additionalNotes"> text genuinely belongs to the same historical person, place, dynasty, or event as <FIELD name="name"> and <FIELD name="fullText">. If additionalNotes is empty, set notesCoherentWithTopic=true and notesDetectedOtherSubject="". If additionalNotes is unmistakably pasted by mistake from a completely different, unrelated historical subject (e.g., discussing Emir Daysam of Azerbaijan when the entry is Shanidar Cave, or discussing poet Besarani when the entry is an Ardalan governor), set notesCoherentWithTopic=false, put the short English name of that unrelated subject in notesDetectedOtherSubject, and set additionalNotes to "" in the output.',
              '3. Convert Kurdish/Eastern numerals (٠١٢٣٤٥٦٧٨٩) into standard Western Arabic numerals (0123456789).',
              '4. Convert "پ.ز" / "پێش زایین" to "BCE" and "ز" / "زایینی" to "CE". Format centuries naturally (e.g., "12th Century CE", "7th Century BCE"). For extreme prehistoric times older than 4000 BCE (such as 70,000 - 30,000 BCE or "سەدەی ٧٠٠ی پێش زایین"), format century naturally as "Paleolithic / Prehistoric Era" instead of "700th Century BCE".',
              '5. Use established English historical orthography for Kurdish entities and cities (e.g. Erbil, Sulaymaniyah, Amed / Diyarbakir, Ardalan, Baban, Soran, Badinan, Bohtan, Medes, Hasanwayhids, Marwanids, Shaddadids, Ayyubids, Shanidar Cave).',
              '6. If an input field is empty, return an empty string "" for that field.',
              '7. For imagesCaptions, return an array of the exact same length as the input imagesCaptions array, translating each non-empty caption in exact order and preserving empty strings as "".',
            ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: structuredInput,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: `Faithful ${targetLangLabel} translation of input name` },
              desc: { type: Type.STRING, description: `Faithful ${targetLangLabel} translation of input desc` },
              fullText: { type: Type.STRING, description: `Faithful ${targetLangLabel} translation of ONLY input fullText` },
              additionalNotes: { type: Type.STRING, description: `Faithful ${targetLangLabel} translation of ONLY input additionalNotes, or "" if notesCoherentWithTopic is false` },
              notesCoherentWithTopic: { type: Type.BOOLEAN, description: 'True if additionalNotes is empty or belongs to the same subject as name/fullText; false only if additionalNotes is unmistakably from a completely unrelated topic' },
              notesDetectedOtherSubject: { type: Type.STRING, description: 'Short name of the unrelated subject if notesCoherentWithTopic is false, otherwise ""' },
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
            },
            required: [
              'name',
              'desc',
              'fullText',
              'additionalNotes',
              'notesCoherentWithTopic',
              'notesDetectedOtherSubject',
              'eraName',
              'eraPeriod',
              'year',
              'century',
              'region',
              'imageCaption',
              'imagesCaptions',
            ],
          },
        },
      });

      const rawText = (response.text || '{}').trim();
      const parsed = JSON.parse(rawText);
      const notesExcluded =
        Boolean((fact.additionalNotes || '').trim()) && parsed.notesCoherentWithTopic === false;

      const translated = {
        name: parsed.name,
        desc: parsed.desc,
        fullText: parsed.fullText,
        additionalNotes: notesExcluded ? '' : parsed.additionalNotes,
        eraName: parsed.eraName,
        eraPeriod: parsed.eraPeriod,
        year: parsed.year,
        century: parsed.century,
        region: parsed.region,
        imageCaption: parsed.imageCaption,
        imagesCaptions: parsed.imagesCaptions,
      };

      res.json({
        translated,
        meta: {
          notesExcluded,
          notesMismatchSubject: notesExcluded ? String(parsed.notesDetectedOtherSubject || '').trim() : undefined,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Translation failed';
      console.error('Gemini /api/translate-fact error:', err);
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/translate-collection', async (req: Request, res: Response) => {
    try {
      const { name, description } = (req.body || {}) as { name?: string; description?: string };
      if (!name) {
        res.status(400).json({ error: 'Missing collection name.' });
        return;
      }

      const ai = createGeminiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: JSON.stringify({ name: name || '', description: description || '' }),
        config: {
          systemInstruction:
            'Translate this Kurdish Sorani historical category/collection name and short description into concise, accurate English.',
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
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({ translated: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Collection translation failed';
      console.error('Gemini /api/translate-collection error:', err);
      res.status(500).json({ error: message });
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
