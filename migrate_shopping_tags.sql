-- Migration: optionale Suffixe "Aktion"/"TK" sowie manuelle Reihenfolge
-- (rauf/runter, wie beim Speiseplan) für Einkaufslisten-Einträge.
-- Bestehende Einträge bleiben unangetastet.
-- Einmalig ausführen: wrangler d1 execute gw5 --remote --file=migrate_shopping_tags.sql

ALTER TABLE shopping_items ADD COLUMN aktion INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shopping_items ADD COLUMN tk INTEGER NOT NULL DEFAULT 0;
ALTER TABLE shopping_items ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
UPDATE shopping_items SET sort_order = rowid;
