import { buildMealPlan, jsonResponse, errorResponse, logAction } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { name, icon, user } = body || {};
    if (!name || !String(name).trim()) return errorResponse('Bitte einen Namen für das Gericht angeben.');

    const id = 'D' + Date.now();
    const maxRow = await db.prepare('SELECT MAX(sort_order) as m FROM dishes').first();
    const nextOrder = (maxRow && maxRow.m != null ? Number(maxRow.m) : -1) + 1;

    await db
      .prepare('INSERT INTO dishes (id, name, icon, active, sort_order) VALUES (?1, ?2, ?3, 1, ?4)')
      .bind(id, String(name).trim(), icon || '🍽️', nextOrder)
      .run();

    await logAction(db, id, name, 'Gericht hinzugefügt', user);

    return jsonResponse(await buildMealPlan(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
