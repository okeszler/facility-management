-- Migration: optionales Suffix "Drogerie" für Einkaufslisten-Einträge.
-- Bestehende Einträge bleiben unangetastet (Flag startet bei 0).
-- Einmalig ausführen: wrangler d1 execute gw5 --remote --file=migrate_shopping_drogerie.sql

ALTER TABLE shopping_items ADD COLUMN drogerie INTEGER NOT NULL DEFAULT 0;
