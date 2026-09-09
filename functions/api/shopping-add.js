import { buildShoppingList, jsonResponse, errorResponse } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { name, aktion, tk, drogerie, user } = body || {};
    if (!name || !String(name).trim()) return errorResponse('Bitte einen Namen eingeben.');

    const id = 'S' + Date.now();
    const maxRow = await db.prepare('SELECT MAX(sort_order) as m FROM shopping_items').first();
    const nextOrder = (maxRow && maxRow.m != null ? Number(maxRow.m) : -1) + 1;

    await db
      .prepare(
        `INSERT INTO shopping_items (id, name, checked, aktion, tk, drogerie, sort_order, added_by, created_at)
         VALUES (?1, ?2, 0, ?3, ?4, ?5, ?6, ?7, ?8)`
      )
      .bind(
        id,
        String(name).trim(),
        aktion ? 1 : 0,
        tk ? 1 : 0,
        drogerie ? 1 : 0,
        nextOrder,
        user || '',
        new Date().toISOString()
      )
      .run();

    return jsonResponse(await buildShoppingList(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
