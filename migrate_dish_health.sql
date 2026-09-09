-- Migration: Ampel (Gesundheit der Mahlzeit) je Gericht nachrüsten.
-- Bestehende Gerichte bleiben unangetastet und starten bei 'yellow' (okay).
-- Einmalig ausführen: wrangler d1 execute gw5 --remote --file=migrate_dish_health.sql

ALTER TABLE dishes ADD COLUMN health TEXT NOT NULL DEFAULT 'yellow';
