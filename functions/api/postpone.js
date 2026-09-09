import { buildFullData, jsonResponse, errorResponse, todayStr, addDays, logAction } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, user } = body || {};
    if (!id) return errorResponse('Aufgaben-ID fehlt.');

    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?1').bind(id).first();
    if (!task) return errorResponse('Aufgabe nicht gefunden.', 404);

    const tomorrow = addDays(todayStr(), 1);
    await db.prepare('UPDATE tasks SET due_date = ?1 WHERE id = ?2').bind(tomorrow, id).run();
    await logAction(db, id, task.name, 'verschoben', user);

    return jsonResponse(await buildFullData(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
