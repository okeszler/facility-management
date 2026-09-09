import { buildFullData, jsonResponse, errorResponse, todayStr, logAction } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { name, category, interval, icon, oneOff, user } = body || {};
    if (!name || !String(name).trim()) return errorResponse('Bitte einen Aufgabennamen angeben.');

    const id = 'T' + Date.now();
    const safeInterval = Math.max(1, Number(interval) || 1);

    await db
      .prepare(
        `INSERT INTO tasks (id, category, name, interval_days, assignee, due_date, icon, active, one_off)
         VALUES (?1, ?2, ?3, ?4, '', ?5, ?6, 1, ?7)`
      )
      .bind(id, category || 'Sonstiges', name, safeInterval, todayStr(), icon || '🧹', oneOff ? 1 : 0)
      .run();

    await logAction(db, id, name, oneOff ? 'hinzugefügt (einmalig)' : 'hinzugefügt', user);

    return jsonResponse(await buildFullData(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
