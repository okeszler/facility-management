import { getMessagesForUser, jsonResponse, errorResponse } from '../_lib.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const user = url.searchParams.get('user') || '';
    const texts = await getMessagesForUser(context.env.DB, user);
    return jsonResponse({ texts });
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
