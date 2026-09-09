import { buildFullData, jsonResponse, errorResponse, todayStr, addDays, logAction } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, user } = body || {};
    if (!id) return errorResponse('Aufgaben-ID fehlt.');

    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?1').bind(id).first();
    if (!task) return errorResponse('Aufgabe nicht gefunden.', 404);

    if (task.one_off) {
      await db.prepare('UPDATE tasks SET active = 0 WHERE id = ?1').bind(id).run();
      await logAction(db, id, task.name, 'nicht erledigt (einmalig, verworfen)', user);
    } else {
      const interval = Math.max(1, Number(task.interval_days) || 1);
      const nextDue = addDays(todayStr(), interval);
      await db.prepare('UPDATE tasks SET due_date = ?1 WHERE id = ?2').bind(nextDue, id).run();
      await logAction(db, id, task.name, 'nicht erledigt', user);
    }

    return jsonResponse(await buildFullData(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
