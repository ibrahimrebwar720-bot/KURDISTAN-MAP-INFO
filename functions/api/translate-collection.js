import { handleTranslateCollectionRequest } from '../_geminiTranslate.js';

export function onRequestPost(context) {
  return handleTranslateCollectionRequest(context.request, context.env);
}
