-- Migration: Einkaufsliste nachrüsten. Legt nur die neue Tabelle an,
-- bestehende Daten bleiben unangetastet.
-- Einmalig ausführen: wrangler d1 execute gw5 --remote --file=migrate_shopping.sql

CREATE TABLE IF NOT EXISTS shopping_items (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  checked    INTEGER NOT NULL DEFAULT 0,
  added_by   TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
