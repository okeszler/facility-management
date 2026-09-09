import { buildMealPlan, jsonResponse, errorResponse } from '../_lib.js';

export async function onRequestGet(context) {
  try {
    const data = await buildMealPlan(context.env.DB);
    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err.message || 'Unbekannter Fehler', 500);
  }
}
