import { buildMealPlan, jsonResponse, errorResponse, logAction } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, user } = body || {};
    if (!id) return errorResponse('Gericht-ID fehlt.');

    const existing = await db.prepare('SELECT id, name FROM dishes WHERE id = ?1').bind(id).first();
    if (!existing) return errorResponse('Gericht nicht gefunden.', 404);

    // Tage, die genau dieses Gericht hatten: Zeile ganz entfernen (nicht nur
    // dish_id leeren), damit sie beim nächsten Laden neu ausgewürfelt werden
    // statt für immer leer zu bleiben (das ist nur bei bewusstem "Zurückstellen" so).
    await db.prepare('DELETE FROM meal_plan WHERE dish_id = ?1').bind(id).run();
    await db.prepare('DELETE FROM dishes WHERE id = ?1').bind(id).run();

    await logAction(db, id, existing.name, 'Gericht gelöscht', user);

    return jsonResponse(await buildMealPlan(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
