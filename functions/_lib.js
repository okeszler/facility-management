// Gemeinsame Helfer für alle /functions/api/*.js-Endpoints.
// Cloudflare Workers laufen ohne feste Zeitzone -> Europe/Vienna wird
// überall explizit über Intl berechnet, genau wie zuvor die Skript-Zeitzone
// in Apps Script.

// en-CA liefert direkt "yyyy-MM-dd"
const viennaDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' });

export function todayStr() {
  return viennaDate.format(new Date());
}

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function weekStart(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = dt.getUTCDay(); // 0=So .. 6=Sa
  const back = dow === 0 ? 6 : dow - 1;
  dt.setUTCDate(dt.getUTCDate() - back);
  return dt.toISOString().slice(0, 10);
}

export function isValidDateStr(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function jsonResponse(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

export function errorResponse(message, status) {
  return jsonResponse({ error: message }, status || 400);
}

// Deckt auch die "(einmalig)"-Varianten ab; "nicht erledigt …" zählt bewusst nicht.
const DONE_PREFIXES = ['erledigt', 'vorgezogen erledigt', 'rückwirkend erledigt'];

/** Liest Tages-/Wochenzähler und Team-Streak aus dem log-Table. */
export async function computeStats(db) {
  const today = todayStr();
  const wStart = weekStart(today);
  // Der log-Table wächst mit jeder Aktion – nur ein begrenztes Fenster lesen.
  const { results } = await db
    .prepare('SELECT ts, action, user FROM log WHERE ts >= ?1')
    .bind(addDays(today, -400))
    .all();

  const todayCounts = {};
  const weekCounts = {};
  const daysWithActivity = {};

  for (const r of results) {
    const action = String(r.action || '');
    if (!DONE_PREFIXES.some((p) => action.startsWith(p))) continue;
    const when = new Date(r.ts);
    if (isNaN(when)) continue;
    // ts ist UTC; der Kalendertag muss in Wiener Zeit bestimmt werden.
    const day = viennaDate.format(when);
    const user = String(r.user || '');
    daysWithActivity[day] = true;
    if (day === today && user) todayCounts[user] = (todayCounts[user] || 0) + 1;
    if (day >= wStart && day <= today && user) weekCounts[user] = (weekCounts[user] || 0) + 1;
  }

  let cursor = daysWithActivity[today] ? today : addDays(today, -1);
  let streak = 0;
  while (daysWithActivity[cursor]) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  return { todayCounts, weekCounts, streak };
}

/** Botschaften NUR für eine bestimmte Person (Groß-/Kleinschreibung egal). Nie alle auf einmal. */
export async function getMessagesForUser(db, name) {
  if (!name) return [];
  const { results } = await db
    .prepare('SELECT text FROM messages WHERE LOWER(for_name) = LOWER(?1)')
    .bind(String(name).trim())
    .all();
  return results.map((r) => String(r.text || '').trim()).filter(Boolean);
}

export async function logAction(db, taskId, taskName, action, user, ts) {
  await db
    .prepare('INSERT INTO log (ts, task_id, task_name, action, user) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(ts || new Date().toISOString(), taskId, taskName, action, user || '')
    .run();
}

/**
 * Kompletter Datensatz, den das Dashboard bei jedem Laden/nach jeder Aktion braucht.
 * Bewusst OHNE Botschaften – die werden separat und nur für die anfragende Person
 * über /api/messages geholt, damit nie alle Botschaften an jedes Gerät gehen.
 */
export async function buildFullData(db) {
  const today = todayStr();

  const taskRows = await db
    .prepare('SELECT id, category, name, interval_days, assignee, due_date, icon, one_off FROM tasks WHERE active = 1')
    .all();
  const tasks = taskRows.results.map((r) => ({
    id: r.id,
    category: r.category || 'Sonstiges',
    name: r.name,
    interval: Math.max(1, Number(r.interval_days) || 1),
    assignee: r.assignee || '',
    due: r.due_date || today,
    icon: r.icon || '🧹',
    oneOff: !!r.one_off
  }));

  const memberRows = await db.prepare('SELECT name, color, emoji FROM members').all();
  const members = memberRows.results.map((r) => ({ name: r.name, color: r.color, emoji: r.emoji }));

  const stats = await computeStats(db);

  return { tasks, members, today, stats };
}

/**
 * Speiseplan für die nächsten `days` Tage (Standard 7), beginnend heute.
 * Tage ohne Eintrag werden mit einem zufälligen aktiven Gericht befüllt
 * und persistiert (wiederholt sich der Tag nicht wieder auf Zufall neu
 * bei jedem Laden, sondern bleibt stabil bis manuell geändert).
 */
export async function buildMealPlan(db, days) {
  days = days || 7;
  const today = todayStr();
  const dates = [];
  for (let i = 0; i < days; i++) dates.push(addDays(today, i));

  const allDishRows = await db
    .prepare('SELECT id, name, icon, active, sort_order FROM dishes ORDER BY sort_order ASC, name ASC')
    .all();
  const allDishes = allDishRows.results;
  const activeDishes = allDishes.filter((d) => d.active);
  const dishMap = {};
  allDishes.forEach((d) => {
    dishMap[d.id] = { id: d.id, name: d.name, icon: d.icon || '🍽️' };
  });

  const placeholders = dates.map((_, i) => '?' + (i + 1)).join(',');
  const planRows = await db
    .prepare(`SELECT date, dish_id FROM meal_plan WHERE date IN (${placeholders})`)
    .bind(...dates)
    .all();
  // planMap hält nur Tage, für die es bereits eine Zeile gibt (auch wenn
  // dish_id NULL ist – "bewusst zurückgestellt" darf NICHT automatisch neu
  // befüllt werden, das unterscheidet es von "noch nie entschieden").
  const planMap = {};
  planRows.results.forEach((r) => {
    planMap[r.date] = r.dish_id;
  });

  const inserts = [];
  let lastDishId = null;
  const daysOut = [];
  for (const date of dates) {
    const hasRow = Object.prototype.hasOwnProperty.call(planMap, date);
    let dishId = hasRow ? planMap[date] : null;
    if (!hasRow && activeDishes.length) {
      let pool = activeDishes;
      if (activeDishes.length > 1 && lastDishId) pool = activeDishes.filter((d) => d.id !== lastDishId);
      dishId = pool[Math.floor(Math.random() * pool.length)].id;
      inserts.push({ date, dishId });
      planMap[date] = dishId;
    }
    lastDishId = dishId || lastDishId;
    daysOut.push({ date, dishId: dishId || null, dish: dishId ? dishMap[dishId] || null : null });
  }

  if (inserts.length) {
    // DO NOTHING + neu lesen: Hat eine parallele Anfrage (anderes Handy) den Tag
    // schon ausgewürfelt, gilt deren Gericht – so zeigen alle Geräte dasselbe.
    await db.batch(
      inserts.map((ins) =>
        db
          .prepare('INSERT INTO meal_plan (date, dish_id) VALUES (?1, ?2) ON CONFLICT(date) DO NOTHING')
          .bind(ins.date, ins.dishId)
      )
    );
    const insDates = inserts.map((ins) => ins.date);
    const stored = await db
      .prepare(`SELECT date, dish_id FROM meal_plan WHERE date IN (${insDates.map((_, i) => '?' + (i + 1)).join(',')})`)
      .bind(...insDates)
      .all();
    stored.results.forEach((r) => {
      const day = daysOut.find((d) => d.date === r.date);
      if (!day) return;
      day.dishId = r.dish_id || null;
      day.dish = r.dish_id ? dishMap[r.dish_id] || null : null;
    });
  }

  return {
    today,
    days: daysOut,
    dishes: activeDishes.map((d) => ({ id: d.id, name: d.name, icon: d.icon || '🍽️' }))
  };
}

/** Einkaufsliste: offene Einträge zuerst (nach Anlage sortiert), erledigte danach. */
export async function buildShoppingList(db) {
  const { results } = await db
    .prepare(
      'SELECT id, name, checked, aktion, tk, drogerie, added_by FROM shopping_items ORDER BY checked ASC, sort_order ASC, created_at ASC'
    )
    .all();
  return {
    items: results.map((r) => ({
      id: r.id,
      name: r.name,
      checked: !!r.checked,
      aktion: !!r.aktion,
      tk: !!r.tk,
      drogerie: !!r.drogerie,
      addedBy: r.added_by || ''
    }))
  };
}
