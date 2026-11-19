import {
  handleTranslateFactRequest,
  handleTranslateCollectionRequest,
} from './functions/_geminiTranslate.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return new Response(
        JSON.stringify({ ok: true, service: 'kurdistan-info-map-worker' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    if (url.pathname === '/api/translate-fact' && request.method === 'POST') {
      return handleTranslateFactRequest(request, env);
    }

    if (url.pathname === '/api/translate-collection' && request.method === 'POST') {
      return handleTranslateCollectionRequest(request, env);
    }

    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'API route not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    return env.ASSETS.fetch(request);
  },
};
