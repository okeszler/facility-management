import { buildMealPlan, jsonResponse, errorResponse, isValidDateStr, todayStr, addDays, logAction } from '../_lib.js';

// Tauscht das Gericht eines Tages mit dem Vor- ('up') oder Folgetag ('down')
// innerhalb des sichtbaren 7-Tage-Fensters.
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { date, direction, user } = body || {};
    if (!isValidDateStr(date)) return errorResponse('Ungültiges Datum.');
    if (direction !== 'up' && direction !== 'down') return errorResponse('Ungültige Richtung.');

    const neighbor = direction === 'up' ? addDays(date, -1) : addDays(date, 1);
    const today = todayStr();
    const maxDate = addDays(today, 6);
    if (neighbor < today || neighbor > maxDate || date < today || date > maxDate) {
      return errorResponse('Am Rand des Zeitraums nicht möglich.');
    }

    // Sorgt dafür, dass beide Tage bereits einen (ggf. automatisch befüllten) Eintrag haben.
    await buildMealPlan(db);

    const rowA = await db.prepare('SELECT dish_id FROM meal_plan WHERE date = ?1').bind(date).first();
    const rowB = await db.prepare('SELECT dish_id FROM meal_plan WHERE date = ?1').bind(neighbor).first();
    const dishA = rowA ? rowA.dish_id : null;
    const dishB = rowB ? rowB.dish_id : null;

    await db.batch([
      db
        .prepare(
          `INSERT INTO meal_plan (date, dish_id) VALUES (?1, ?2)
           ON CONFLICT(date) DO UPDATE SET dish_id = excluded.dish_id`
        )
        .bind(date, dishB),
      db
        .prepare(
          `INSERT INTO meal_plan (date, dish_id) VALUES (?1, ?2)
           ON CONFLICT(date) DO UPDATE SET dish_id = excluded.dish_id`
        )
        .bind(neighbor, dishA)
    ]);

    await logAction(db, null, null, 'Speiseplan getauscht (' + date + ' <-> ' + neighbor + ')', user);

    return jsonResponse(await buildMealPlan(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
