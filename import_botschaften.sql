-- Import: Botschaften (voller Ersatz für die betroffenen Personen, damit keine Duplikate entstehen)
DELETE FROM messages WHERE for_name IN ('Andreea','Florian','Oliver');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Danke, dass du unter der Woche so viel stemmst 💜');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Du hältst hier alles zusammen – das sehe ich 😘');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Ohne dich würde hier nichts laufen. Danke! 🌷');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Job, Kinder, Haushalt und gut aussehen, wie machst du das!? 🤷');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Während ich noch überlege, hast du''s schon erledigt. Danke ☺️');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Ohne dich gäb''s hier nur Toast und Nudeln 😛');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Du bist die fleissigste Bufniţă weit und breit 💪');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Andreea, Meisterin im "Ich mach das schnell noch" 🚀');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Wenn Aufräumen eine Sportart wäre, hättest du längst ein Trikot mit Sponsoren 🥇');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Küche blitzblank – irgendwo klatscht gerade ein Marie-Kondo-Fanclub 😉');
INSERT INTO messages (for_name, text) VALUES ('Andreea', 'vv');
INSERT INTO messages (for_name, text) VALUES ('Andreea', '11-11');
INSERT INTO messages (for_name, text) VALUES ('Andreea', '😘');
INSERT INTO messages (for_name, text) VALUES ('Andreea', '🦄🦄');
INSERT INTO messages (for_name, text) VALUES ('Oliver', 'Nicht vergessen - du hast auch noch einen Vollzeitjob');
INSERT INTO messages (for_name, text) VALUES ('Oliver', 'Aufgabe gründlich erledigt?');
INSERT INTO messages (for_name, text) VALUES ('Oliver', 'Allen recht getan ist eine Kunst die niemand kann 🥳');
