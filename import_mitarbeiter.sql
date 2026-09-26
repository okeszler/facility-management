-- Import: Mitarbeiter (upsert per Name; Farben von Oliver/Andreea/Florian bewusst
-- auf der aktuellen App-Palette belassen, NICHT aus der CSV übernommen - siehe Hinweis im Chat)
INSERT INTO members (name, color, emoji) VALUES ('Oliver', '#6C3FA6', '🤓') ON CONFLICT(name) DO UPDATE SET color=excluded.color, emoji=excluded.emoji;
INSERT INTO members (name, color, emoji) VALUES ('Andreea', '#9B7FD9', '🐝') ON CONFLICT(name) DO UPDATE SET color=excluded.color, emoji=excluded.emoji;
INSERT INTO members (name, color, emoji) VALUES ('Florian', '#E8792E', '🦥') ON CONFLICT(name) DO UPDATE SET color=excluded.color, emoji=excluded.emoji;
INSERT INTO members (name, color, emoji) VALUES ('Everybody', '#6b3de8', '🙈') ON CONFLICT(name) DO UPDATE SET color=excluded.color, emoji=excluded.emoji;
