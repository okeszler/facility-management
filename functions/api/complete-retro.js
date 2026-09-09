import { buildFullData, jsonResponse, errorResponse, todayStr, addDays, isValidDateStr, logAction } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, user, dateStr } = body || {};
    if (!id) return errorResponse('Aufgaben-ID fehlt.');
    if (!isValidDateStr(dateStr)) return errorResponse('Ungültiges Datum.');
    if (dateStr >= todayStr()) {
      return errorResponse('Bitte ein Datum in der Vergangenheit wählen (für heute den normalen Erledigt-Button nutzen).');
    }

    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?1').bind(id).first();
    if (!task) return errorResponse('Aufgabe nicht gefunden.', 404);

    const ts = dateStr + 'T12:00:00.000Z';

    if (task.one_off) {
      await db.prepare('UPDATE tasks SET active = 0 WHERE id = ?1').bind(id).run();
      await logAction(db, id, task.name, 'rückwirkend erledigt (einmalig)', user, ts);
    } else {
      const interval = Math.max(1, Number(task.interval_days) || 1);
      const nextDue = addDays(dateStr, interval);
      await db.prepare('UPDATE tasks SET due_date = ?1 WHERE id = ?2').bind(nextDue, id).run();
      await logAction(db, id, task.name, 'rückwirkend erledigt', user, ts);
    }

    return jsonResponse(await buildFullData(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
