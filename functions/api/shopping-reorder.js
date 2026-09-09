import { buildShoppingList, jsonResponse, errorResponse } from '../_lib.js';

// Tauscht die Reihenfolge mit dem Nachbarn – bleibt innerhalb der eigenen
// Gruppe (offen/erledigt), überspringt also nicht die Erledigt-Grenze.
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, direction } = body || {};
    if (!id || (direction !== 'up' && direction !== 'down')) return errorResponse('Ungültige Anfrage.');

    const { results } = await db
      .prepare('SELECT id, checked, sort_order FROM shopping_items ORDER BY checked ASC, sort_order ASC, created_at ASC')
      .all();
    const idx = results.findIndex((it) => it.id === id);
    if (idx === -1) return errorResponse('Eintrag nicht gefunden.', 404);

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= results.length) return jsonResponse(await buildShoppingList(db));

    const a = results[idx];
    const b = results[swapIdx];
    if (a.checked !== b.checked) return jsonResponse(await buildShoppingList(db));

    await db.batch([
      db.prepare('UPDATE shopping_items SET sort_order = ?1 WHERE id = ?2').bind(b.sort_order, a.id),
      db.prepare('UPDATE shopping_items SET sort_order = ?1 WHERE id = ?2').bind(a.sort_order, b.id)
    ]);

    return jsonResponse(await buildShoppingList(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
