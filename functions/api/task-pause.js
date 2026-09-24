import { buildFullData, jsonResponse, errorResponse, todayStr, logAction } from '../_lib.js';

// paused: true -> Aufgabe ausblenden; false -> wieder aktivieren, fällig ab heute
// (sonst stünde sie nach längerer Pause sofort viele Tage "überfällig" da).
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, paused, user } = body || {};
    if (!id) return errorResponse('Aufgaben-ID fehlt.');

    const task = await db.prepare('SELECT name, one_off FROM tasks WHERE id = ?1').bind(id).first();
    if (!task) return errorResponse('Aufgabe nicht gefunden.', 404);
    if (task.one_off) return errorResponse('Einmalige Aufgaben können nicht pausiert werden.');

    if (paused) {
      await db.prepare('UPDATE tasks SET active = 0 WHERE id = ?1').bind(id).run();
    } else {
      await db.prepare('UPDATE tasks SET active = 1, due_date = ?1 WHERE id = ?2').bind(todayStr(), id).run();
    }
    await logAction(db, id, task.name, paused ? 'pausiert' : 'fortgesetzt', user);

    return jsonResponse(await buildFullData(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
