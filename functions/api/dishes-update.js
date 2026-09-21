import { buildMealPlan, jsonResponse, errorResponse, logAction } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, name, icon, user } = body || {};
    if (!id) return errorResponse('Gericht-ID fehlt.');
    if (!name || !String(name).trim()) return errorResponse('Bitte einen Namen für das Gericht angeben.');

    const existing = await db.prepare('SELECT id FROM dishes WHERE id = ?1').bind(id).first();
    if (!existing) return errorResponse('Gericht nicht gefunden.', 404);

    await db
      .prepare('UPDATE dishes SET name = ?1, icon = ?2 WHERE id = ?3')
      .bind(String(name).trim(), icon || '🍽️', id)
      .run();

    await logAction(db, id, name, 'Gericht bearbeitet', user);

    return jsonResponse(await buildMealPlan(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
