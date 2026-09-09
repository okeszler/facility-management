import { buildMealPlan, jsonResponse, errorResponse, logAction, normalizeHealth } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, name, icon, health, user } = body || {};
    if (!id) return errorResponse('Gericht-ID fehlt.');
    if (!name || !String(name).trim()) return errorResponse('Bitte einen Namen für das Gericht angeben.');

    const existing = await db.prepare('SELECT id FROM dishes WHERE id = ?1').bind(id).first();
    if (!existing) return errorResponse('Gericht nicht gefunden.', 404);

    await db
      .prepare('UPDATE dishes SET name = ?1, icon = ?2, health = ?3 WHERE id = ?4')
      .bind(String(name).trim(), icon || '🍽️', normalizeHealth(health), id)
      .run();

    await logAction(db, id, name, 'Gericht bearbeitet', user);

    return jsonResponse(await buildMealPlan(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
