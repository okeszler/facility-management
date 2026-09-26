-- Facility Management GW5 – D1-Schema
-- Einmalig ausführen: wrangler d1 execute gw5 --remote --file=schema.sql
--
-- ⚠️ ACHTUNG: NUR BEI DER ERSTEINRICHTUNG! Die folgenden DROP TABLE-Befehle
-- löschen auf einer bestehenden Datenbank ALLE Daten unwiderruflich
-- (Aufgaben, Historie, Speiseplan, Einkaufsliste). Für Änderungen an einer
-- laufenden Datenbank die passende migrate_*.sql verwenden.

DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS log;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS meal_plan;
DROP TABLE IF EXISTS shopping_items;

CREATE TABLE tasks (
  id            TEXT PRIMARY KEY,
  category      TEXT NOT NULL,
  name          TEXT NOT NULL,
  interval_days INTEGER NOT NULL DEFAULT 1,
  assignee      TEXT NOT NULL DEFAULT '',
  due_date      TEXT NOT NULL,           -- yyyy-MM-dd
  icon          TEXT NOT NULL DEFAULT '🧹',
  active        INTEGER NOT NULL DEFAULT 1,  -- 1 = aktiv, 0 = inaktiv
  one_off       INTEGER NOT NULL DEFAULT 0   -- 1 = einmalige Aufgabe
);

CREATE TABLE members (
  name  TEXT PRIMARY KEY,
  color TEXT NOT NULL,
  emoji TEXT NOT NULL
);

CREATE TABLE log (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        TEXT NOT NULL,        -- ISO-Zeitstempel
  task_id   TEXT,
  task_name TEXT,
  action    TEXT NOT NULL,
  user      TEXT NOT NULL DEFAULT ''
);

CREATE TABLE messages (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  for_name TEXT NOT NULL,
  text     TEXT NOT NULL
);

-- Speiseplanung: Pool an Gerichten (Hauptgerichte)
CREATE TABLE dishes (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '🍽️',
  active     INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Speiseplanung: welches Gericht an welchem Tag (yyyy-MM-dd)
CREATE TABLE meal_plan (
  date    TEXT PRIMARY KEY,
  dish_id TEXT
);

-- Einkaufsliste: gemeinsame, freie Liste (kein Pool, direkt Text pro Zeile)
CREATE TABLE shopping_items (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  checked    INTEGER NOT NULL DEFAULT 0,
  aktion     INTEGER NOT NULL DEFAULT 0,   -- optionales Suffix "Aktion"
  tk         INTEGER NOT NULL DEFAULT 0,   -- optionales Suffix "TK" (Tiefkühl)
  drogerie   INTEGER NOT NULL DEFAULT 0,   -- optionales Suffix "Drogerie"
  sort_order INTEGER NOT NULL DEFAULT 0,   -- manuelle Reihenfolge (rauf/runter in der App)
  added_by   TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

-- Mitarbeiter
INSERT INTO members (name, color, emoji) VALUES
  ('Oliver', '#6C3FA6', '🦉'),
  ('Andreea', '#9B7FD9', '🌷');

-- Aufgaben (Fällig-Datum wird beim ersten Aufruf der App via /api/seed-dates
-- ohnehin nicht benötigt – hier direkt auf "heute" gesetzt via CURRENT_DATE)
INSERT INTO tasks (id, category, name, interval_days, assignee, due_date, icon, active, one_off) VALUES
  ('T1000','Küche','Geschirr & Oberflächen',1,'Oliver',date('now'),'🍽️',1,0),
  ('T1001','Küche','Boden wischen',3,'Andreea',date('now'),'🧽',1,0),
  ('T1002','Küche','Kühlschrank auswischen',14,'Oliver',date('now'),'🧊',1,0),
  ('T1003','Küche','Backofen reinigen',30,'Andreea',date('now'),'🔥',1,0),
  ('T1004','Badezimmer','Toilette',3,'',date('now'),'🚽',1,0),
  ('T1005','Badezimmer','Waschbecken & Spiegel',3,'',date('now'),'🪞',1,0),
  ('T1006','Badezimmer','Badewanne / Dusche',7,'Oliver',date('now'),'🛁',1,0),
  ('T1007','Badezimmer','Boden wischen',7,'Andreea',date('now'),'🧴',1,0),
  ('T1008','Wohnbereich','Staubsaugen',3,'',date('now'),'🌀',1,0),
  ('T1009','Wohnbereich','Staub wischen',7,'',date('now'),'🪶',1,0),
  ('T1010','Wohnbereich','Fenster putzen',60,'Oliver',date('now'),'🪟',1,0),
  ('T1011','Kinderzimmer','Aufräumen & Spielzeug',1,'Andreea',date('now'),'🧸',1,0),
  ('T1012','Kinderzimmer','Staubsaugen',3,'',date('now'),'🌀',1,0),
  ('T1013','Wäsche','Waschmaschine anwerfen',2,'Andreea',date('now'),'👕',1,0),
  ('T1014','Wäsche','Bettwäsche wechseln',14,'Oliver',date('now'),'🛏️',1,0),
  ('T1015','Sonstiges','Müll rausbringen',2,'Oliver',date('now'),'🗑️',1,0),
  ('T1016','Sonstiges','Altpapier & Recycling',7,'',date('now'),'♻️',1,0);

-- Botschaften (Platzhalter, direkt in D1 oder über die Studio-UI erweiterbar)
INSERT INTO messages (for_name, text) VALUES
  ('Andreea', 'Danke, dass du unter der Woche so viel stemmst 💜'),
  ('Andreea', 'Du hältst hier alles zusammen – das sehe ich.'),
  ('Andreea', 'Ohne dich würde hier nichts laufen. Danke! 🌷');

-- Gerichte (Startpool, in der App oder über D1/Sheets beliebig erweiterbar)
INSERT INTO dishes (id, name, icon, active, sort_order) VALUES
  ('D1000','Spaghetti Bolognese','🍝',1,0),
  ('D1001','Schnitzel mit Kartoffelsalat','🍖',1,1),
  ('D1002','Gemüsecurry mit Reis','🍛',1,2),
  ('D1003','Pizza','🍕',1,3),
  ('D1004','Kartoffelgratin','🥔',1,4),
  ('D1005','Gebratener Fisch mit Salat','🐟',1,5),
  ('D1006','Burger mit Pommes','🍔',1,6),
  ('D1007','Gemüsesuppe','🍲',1,7),
  ('D1008','Risotto','🍚',1,8),
  ('D1009','Tacos','🌮',1,9);
