// Gemeinsame Helfer für alle /functions/api/*.js-Endpoints.
// Cloudflare Workers laufen ohne feste Zeitzone -> Europe/Vienna wird
// überall explizit über Intl berechnet, genau wie zuvor die Skript-Zeitzone
// in Apps Script.

export function todayStr() {
  // en-CA liefert direkt "yyyy-MM-dd"
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(new Date());
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

/** Liest Tages-/Wochenzähler und Team-Streak aus dem log-Table. */
export async function computeStats(db) {
  const today = todayStr();
  const wStart = weekStart(today);
  const { results } = await db
    .prepare('SELECT ts, action, user FROM log')
    .all();

  const todayCounts = {};
  const weekCounts = {};
  const daysWithActivity = {};

  for (const r of results) {
    const action = String(r.action || '');
    const isDone = action === 'erledigt' || action === 'vorgezogen erledigt' || action.indexOf('rückwirkend erledigt') === 0;
    if (!isDone) continue;
    const day = String(r.ts).slice(0, 10);
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
    .prepare('SELECT id, name, icon, active, sort_order, health FROM dishes ORDER BY sort_order ASC, name ASC')
    .all();
  const allDishes = allDishRows.results;
  const activeDishes = allDishes.filter((d) => d.active);
  const dishMap = {};
  allDishes.forEach((d) => {
    dishMap[d.id] = { id: d.id, name: d.name, icon: d.icon || '🍽️', health: d.health || 'yellow' };
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

  for (const ins of inserts) {
    await db
      .prepare(
        `INSERT INTO meal_plan (date, dish_id) VALUES (?1, ?2)
         ON CONFLICT(date) DO UPDATE SET dish_id = excluded.dish_id`
      )
      .bind(ins.date, ins.dishId)
      .run();
  }

  return {
    today,
    days: daysOut,
    dishes: activeDishes.map((d) => ({ id: d.id, name: d.name, icon: d.icon || '🍽️', health: d.health || 'yellow' }))
  };
}

export function normalizeHealth(h) {
  return h === 'green' || h === 'red' ? h : 'yellow';
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
