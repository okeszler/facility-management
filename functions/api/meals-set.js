import { buildMealPlan, jsonResponse, errorResponse, isValidDateStr, logAction } from '../_lib.js';

// dishId angegeben -> genau dieses Gericht für den Tag setzen.
// sonst -> zufälliges (anderes) aktives Gericht auswürfeln.
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { date, dishId, user } = body || {};
    if (!isValidDateStr(date)) return errorResponse('Ungültiges Datum.');

    let finalDishId = dishId;
    if (!finalDishId) {
      const current = await db.prepare('SELECT dish_id FROM meal_plan WHERE date = ?1').bind(date).first();
      const { results: dishes } = await db.prepare('SELECT id FROM dishes WHERE active = 1').all();
      if (!dishes.length) return errorResponse('Es sind noch keine Gerichte hinterlegt.');
      let pool = dishes;
      if (dishes.length > 1 && current && current.dish_id) {
        pool = dishes.filter((d) => d.id !== current.dish_id);
      }
      finalDishId = pool[Math.floor(Math.random() * pool.length)].id;
    } else {
      const dish = await db.prepare('SELECT id FROM dishes WHERE id = ?1').bind(finalDishId).first();
      if (!dish) return errorResponse('Gericht nicht gefunden.', 404);
    }

    await db
      .prepare(
        `INSERT INTO meal_plan (date, dish_id) VALUES (?1, ?2)
         ON CONFLICT(date) DO UPDATE SET dish_id = excluded.dish_id`
      )
      .bind(date, finalDishId)
      .run();

    await logAction(db, finalDishId, null, 'Speiseplan geändert (' + date + ')', user);

    return jsonResponse(await buildMealPlan(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
