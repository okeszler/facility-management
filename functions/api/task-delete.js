import { buildFullData, jsonResponse, errorResponse, logAction } from '../_lib.js';

// Die Erledigt-Historie im log bleibt erhalten (Statistik/Streak zählen weiter).
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, user } = body || {};
    if (!id) return errorResponse('Aufgaben-ID fehlt.');

    const task = await db.prepare('SELECT name FROM tasks WHERE id = ?1').bind(id).first();
    if (!task) return errorResponse('Aufgabe nicht gefunden.', 404);

    await db.prepare('DELETE FROM tasks WHERE id = ?1').bind(id).run();
    await logAction(db, id, task.name, 'gelöscht', user);

    return jsonResponse(await buildFullData(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
