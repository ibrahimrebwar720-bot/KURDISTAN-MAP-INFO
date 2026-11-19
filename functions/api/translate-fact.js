import { handleTranslateFactRequest } from '../_geminiTranslate.js';

export function onRequestPost(context) {
  return handleTranslateFactRequest(context.request, context.env);
}
