import { buildShoppingList, jsonResponse, errorResponse } from '../_lib.js';

export async function onRequestPost(context) {
  const db = context.env.DB;
  try {
    const body = await context.request.json();
    const { id, checked } = body || {};
    if (!id) return errorResponse('Eintrag-ID fehlt.');

    const item = await db.prepare('SELECT checked FROM shopping_items WHERE id = ?1').bind(id).first();
    // Offline abgehakt, inzwischen von jemand anderem gelöscht: einfach ignorieren.
    if (!item) return jsonResponse(await buildShoppingList(db));

    // Expliziter Zielwert (idempotent, wichtig für nachgeholte Offline-Aktionen);
    // ohne Angabe wie bisher umschalten.
    const next = typeof checked === 'boolean' ? checked : !item.checked;
    await db
      .prepare('UPDATE shopping_items SET checked = ?1 WHERE id = ?2')
      .bind(next ? 1 : 0, id)
      .run();

    return jsonResponse(await buildShoppingList(db));
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
