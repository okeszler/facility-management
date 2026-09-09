import { buildShoppingList, jsonResponse, errorResponse } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id } = body || {};
    if (!id) return errorResponse('Eintrag-ID fehlt.');

    await db.prepare('DELETE FROM shopping_items WHERE id = ?1').bind(id).run();

    return jsonResponse(await buildShoppingList(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
