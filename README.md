# Facility Management GW5 – Cloudflare-Version

Ersetzt die bisherige Google-Apps-Script-Version durch:
- **Cloudflare Pages** – Hosting von `index.html` + Icons/Manifest
- **Cloudflare Pages Functions** (`/functions/api/*.js`) – ersetzt `Code.gs`
- **Cloudflare D1** (SQLite-Datenbank) – ersetzt das Google Sheet

## Einmalige Einrichtung

1. **Wrangler installieren** (falls noch nicht vorhanden):
   ```
   npm install -g wrangler
   wrangler login
   ```

2. **D1-Datenbank anlegen:**
   ```
   wrangler d1 create gw5
   ```
   Die Ausgabe enthält eine `database_id` – die in `wrangler.toml` bei
   `database_id = "DEINE_DATABASE_ID_HIER"` eintragen.

3. **Schema + Startdaten einspielen:**
   ```
   wrangler d1 execute gw5 --remote --file=schema.sql
   ```

4. **Pages-Projekt erstellen & deployen:**
   ```
   wrangler pages deploy . --project-name=gw5-facility-management
   ```
   Beim ersten Deploy fragt Wrangler nach Bestätigung, ein neues Projekt anzulegen.

5. **D1-Bindung im Cloudflare-Dashboard verknüpfen** (wichtig – geht nicht rein
   über wrangler.toml bei Pages):
   Cloudflare-Dashboard → Workers & Pages → gw5-facility-management →
   Settings → Functions → D1 database bindings → Add binding:
   - Variable name: `DB`
   - D1 database: `gw5`
   
   Danach einmal neu deployen (`wrangler pages deploy .`), damit die
   Bindung aktiv wird.

6. Die ausgegebene `*.pages.dev`-URL öffnen – fertig. Für eine eigene
   Domain (z. B. `putzplan.eure-domain.at`) im Dashboard unter
   "Custom domains" ergänzen.

## Laufender Betrieb

- **Botschaften pflegen:** direkt in D1 über `wrangler d1 execute gw5 --remote --command="INSERT INTO messages (for_name, text) VALUES ('Andreea', 'Neuer Text');"`
  oder komfortabler über die Tabellen-Ansicht im Cloudflare-Dashboard
  (Workers & Pages → D1 → gw5 → Tables → messages → Zeile hinzufügen).
- **Neue Aufgaben/Mitarbeiter:** genauso über die D1-Tabellenansicht im
  Dashboard möglich, ganz ohne Code.
- **Code-Änderungen:** einfach die Dateien anpassen und erneut
  `wrangler pages deploy .` ausführen – kein manuelles "Bereitstellen"
  mit Versionsverwaltung mehr nötig wie bei Apps Script.

## Speiseplanung (Erweiterung)

Jedem Tag wird ein Hauptgericht zugeordnet, aus einem Pool an Gerichten
(Tabelle `dishes`). Fehlt für einen Tag noch ein Eintrag, wird beim ersten
Laden automatisch eines zufällig ausgewählt und in `meal_plan` gespeichert
(bleibt danach stabil, bis es manuell geändert wird).

**Einmalig auf einer bereits laufenden Remote-DB einspielen** (legt nur die
zwei neuen Tabellen an, alles Bestehende bleibt unangetastet):
```
wrangler d1 execute gw5 --remote --file=migrate_speiseplan.sql
```
Bei einer komplett neuen DB reicht das normale `schema.sql` – das enthält
`dishes`/`meal_plan` bereits mit.

**Gerichte pflegen** – drei Wege, wie gewohnt:
1. **In der App:** unten in der Speiseplan-Sektion auf „+ Neues Gericht“ tippen.
2. **Direkt in D1:** `wrangler d1 execute gw5 --remote --command="INSERT INTO dishes (id, name, icon, active) VALUES ('D2000', 'Ofengemüse', '🥕', 1);"`
   oder über die Tabellen-Ansicht im Cloudflare-Dashboard (D1 → gw5 → Tables → dishes).
3. **Über Sheets:** `Google Sheets/Serviceplan - Gerichte.csv` pflegen, daraus
   `import_gerichte.sql` aktualisieren (gleiches Muster wie
   `import_aufgaben.sql`) und einspielen:
   ```
   wrangler d1 execute gw5 --remote --file=import_gerichte.sql
   ```

**Tag ändern:** In der App bei einem Tag auf 🔀 tippen (würfelt ein anderes
Gericht) oder auf ✏️ (gezielt ein Gericht aus dem Pool wählen).

## Was sich strukturell ändert (gegenüber Apps Script)

| Vorher (Apps Script)      | Jetzt (Cloudflare)                  |
|---------------------------|--------------------------------------|
| Google Sheet              | D1-Datenbank (Tabellen: tasks, members, log, messages) |
| `Code.gs`                 | `/functions/api/*.js`               |
| `google.script.run(...)`  | `fetch('/api/...')`                 |
| exec-URL über Google-Sandbox (iframe) | echte eigene Domain, kein Sandbox-Problem mehr |
| Icon auf Homescreen unzuverlässig | echtes PNG-Icon + Manifest, funktioniert direkt |
