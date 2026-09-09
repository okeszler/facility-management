import { buildShoppingList, jsonResponse, errorResponse } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id } = body || {};
    if (!id) return errorResponse('Eintrag-ID fehlt.');

    const item = await db.prepare('SELECT checked FROM shopping_items WHERE id = ?1').bind(id).first();
    if (!item) return errorResponse('Eintrag nicht gefunden.', 404);

    await db
      .prepare('UPDATE shopping_items SET checked = ?1 WHERE id = ?2')
      .bind(item.checked ? 0 : 1, id)
      .run();

    return jsonResponse(await buildShoppingList(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
