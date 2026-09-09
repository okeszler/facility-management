-- Migration: Speiseplanung nachrüsten auf einer bestehenden Remote-DB.
-- Im Gegensatz zu schema.sql werden hier KEINE Tabellen gedroppt –
-- bestehende Aufgaben/Mitarbeiter/Log/Botschaften bleiben unangetastet.
-- Einmalig ausführen: wrangler d1 execute gw5 --remote --file=migrate_speiseplan.sql

CREATE TABLE IF NOT EXISTS dishes (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  icon   TEXT NOT NULL DEFAULT '🍽️',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS meal_plan (
  date    TEXT PRIMARY KEY,
  dish_id TEXT
);

-- Startpool an Gerichten (wird nur eingefügt, falls die ID noch nicht existiert)
INSERT OR IGNORE INTO dishes (id, name, icon, active) VALUES
  ('D1000','Spaghetti Bolognese','🍝',1),
  ('D1001','Schnitzel mit Kartoffelsalat','🍖',1),
  ('D1002','Gemüsecurry mit Reis','🍛',1),
  ('D1003','Pizza','🍕',1),
  ('D1004','Kartoffelgratin','🥔',1),
  ('D1005','Gebratener Fisch mit Salat','🐟',1),
  ('D1006','Burger mit Pommes','🍔',1),
  ('D1007','Gemüsesuppe','🍲',1),
  ('D1008','Risotto','🍚',1),
  ('D1009','Tacos','🌮',1);
