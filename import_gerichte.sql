-- Import: Gerichte (upsert per ID). Aus "Google Sheets/Serviceplan - Gerichte.csv"
-- generiert/gepflegt. Neue Zeile im Sheet = neue INSERT-Zeile hier mit neuer ID
-- (z. B. D1010, D1011, ...). "Aktiv" = ja/nein -> 1/0.
-- Ausführen: wrangler d1 execute gw5 --remote --file=import_gerichte.sql

INSERT INTO dishes (id, name, icon, active) VALUES ('D1000', 'Spaghetti Bolognese', '🍝', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
INSERT INTO dishes (id, name, icon, active) VALUES ('D1001', 'Schnitzel mit Kartoffelsalat', '🍖', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
INSERT INTO dishes (id, name, icon, active) VALUES ('D1002', 'Gemüsecurry mit Reis', '🍛', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
INSERT INTO dishes (id, name, icon, active) VALUES ('D1003', 'Pizza', '🍕', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
INSERT INTO dishes (id, name, icon, active) VALUES ('D1004', 'Kartoffelgratin', '🥔', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
INSERT INTO dishes (id, name, icon, active) VALUES ('D1005', 'Gebratener Fisch mit Salat', '🐟', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
INSERT INTO dishes (id, name, icon, active) VALUES ('D1006', 'Burger mit Pommes', '🍔', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
INSERT INTO dishes (id, name, icon, active) VALUES ('D1007', 'Gemüsesuppe', '🍲', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
INSERT INTO dishes (id, name, icon, active) VALUES ('D1008', 'Risotto', '🍚', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
INSERT INTO dishes (id, name, icon, active) VALUES ('D1009', 'Tacos', '🌮', 1) ON CONFLICT(id) DO UPDATE SET name=excluded.name, icon=excluded.icon, active=excluded.active;
