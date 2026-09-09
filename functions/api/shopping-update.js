import { buildShoppingList, jsonResponse, errorResponse } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, name, aktion, tk, drogerie } = body || {};
    if (!id) return errorResponse('Eintrag-ID fehlt.');
    if (!name || !String(name).trim()) return errorResponse('Bitte einen Namen eingeben.');

    const existing = await db.prepare('SELECT id FROM shopping_items WHERE id = ?1').bind(id).first();
    if (!existing) return errorResponse('Eintrag nicht gefunden.', 404);

    await db
      .prepare('UPDATE shopping_items SET name = ?1, aktion = ?2, tk = ?3, drogerie = ?4 WHERE id = ?5')
      .bind(String(name).trim(), aktion ? 1 : 0, tk ? 1 : 0, drogerie ? 1 : 0, id)
      .run();

    return jsonResponse(await buildShoppingList(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
