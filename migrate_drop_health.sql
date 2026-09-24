-- Migration: Ernährungsampel komplett entfernen (Spalte "health" bei Gerichten).
-- Die App nutzt die Spalte nicht mehr; Gerichte selbst bleiben unangetastet.
-- Einmalig ausführen: wrangler d1 execute gw5 --remote --file=migrate_drop_health.sql

ALTER TABLE dishes DROP COLUMN health;
