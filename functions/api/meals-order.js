import { buildMealPlan, jsonResponse, errorResponse, isValidDateStr, logAction } from '../_lib.js';

// Setzt die komplette Zuordnung Datum -> Gericht auf einmal (nach Drag & Drop
// im 7-Tage-Speiseplan; die Tage selbst bleiben fix, nur die Gerichte tauschen).
export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { assignments, user } = body || {};
    if (!Array.isArray(assignments) || !assignments.length) return errorResponse('Ungültige Zuordnung.');
    for (const a of assignments) {
      if (!isValidDateStr(a && a.date)) return errorResponse('Ungültiges Datum.');
    }

    const writes = assignments.map((a) =>
      db
        .prepare(
          `INSERT INTO meal_plan (date, dish_id) VALUES (?1, ?2)
           ON CONFLICT(date) DO UPDATE SET dish_id = excluded.dish_id`
        )
        .bind(a.date, a.dishId || null)
    );
    await db.batch(writes);

    await logAction(db, null, null, 'Speiseplan neu sortiert', user);

    return jsonResponse(await buildMealPlan(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
