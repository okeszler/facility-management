import { buildMealPlan, jsonResponse, errorResponse } from '../_lib.js';

// Setzt die komplette Reihenfolge auf einmal (nach Drag & Drop in der App).
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { ids } = body || {};
    if (!Array.isArray(ids) || !ids.length) return errorResponse('Ungültige Reihenfolge.');

    const writes = ids.map((id, i) =>
      db.prepare('UPDATE dishes SET sort_order = ?1 WHERE id = ?2').bind(i, id)
    );
    await db.batch(writes);

    return jsonResponse(await buildMealPlan(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
