import { buildMealPlan, jsonResponse, errorResponse } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, direction } = body || {};
    if (!id || (direction !== 'up' && direction !== 'down')) return errorResponse('Ungültige Anfrage.');

    const { results } = await db
      .prepare('SELECT id, sort_order FROM dishes ORDER BY sort_order ASC, name ASC')
      .all();
    const idx = results.findIndex((d) => d.id === id);
    if (idx === -1) return errorResponse('Gericht nicht gefunden.', 404);

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= results.length) return jsonResponse(await buildMealPlan(db));

    const a = results[idx];
    const b = results[swapIdx];
    await db.batch([
      db.prepare('UPDATE dishes SET sort_order = ?1 WHERE id = ?2').bind(b.sort_order, a.id),
      db.prepare('UPDATE dishes SET sort_order = ?1 WHERE id = ?2').bind(a.sort_order, b.id)
    ]);

    return jsonResponse(await buildMealPlan(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
