import { buildFullData, jsonResponse, errorResponse, logAction } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, name, category, interval, assignee, icon, user } = body || {};
    if (!id) return errorResponse('Aufgaben-ID fehlt.');
    if (!name || !String(name).trim()) return errorResponse('Bitte einen Aufgabennamen angeben.');

    const existing = await db.prepare('SELECT id FROM tasks WHERE id = ?1').bind(id).first();
    if (!existing) return errorResponse('Aufgabe nicht gefunden.', 404);

    const safeInterval = Math.max(1, Number(interval) || 1);

    await db
      .prepare(
        `UPDATE tasks SET category = ?1, name = ?2, interval_days = ?3, assignee = ?4, icon = ?5 WHERE id = ?6`
      )
      .bind(category || 'Sonstiges', String(name).trim(), safeInterval, assignee || '', icon || '🧹', id)
      .run();

    await logAction(db, id, name, 'bearbeitet', user);

    return jsonResponse(await buildFullData(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
