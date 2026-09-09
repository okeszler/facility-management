-- Migration: Gerichte verwalten (bearbeiten/löschen/sortieren) nachrüsten.
-- Fügt die Sortier-Spalte hinzu und nummeriert bestehende Gerichte anhand
-- ihrer bisherigen Reihenfolge durch. Bestehende Daten bleiben unangetastet.
-- Einmalig ausführen: wrangler d1 execute gw5 --remote --file=migrate_dishes_manage.sql

ALTER TABLE dishes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
UPDATE dishes SET sort_order = rowid;
