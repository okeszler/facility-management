-- Florian als Mitarbeiter entfernen (einmalig in der D1-Konsole ausführen).
-- Seine Aufgaben bleiben erhalten, sind danach aber "niemand Bestimmtes" und
-- können in der App unter "Aufgaben bearbeiten" neu zugeteilt werden.
-- Die Erledigt-Historie (log) bleibt unverändert.
UPDATE tasks SET assignee = '' WHERE assignee = 'Florian';
DELETE FROM messages WHERE for_name = 'Florian';
DELETE FROM members WHERE name = 'Florian';
