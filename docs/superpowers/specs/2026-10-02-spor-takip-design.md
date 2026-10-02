# Spor Takip — Design

Date: 2026-10-02

## Goal

A workout tracker for two people (one iPhone, one Samsung) that each use with fully separate data: gym strength/cardio program, live set logging, exercise how-to library, progress tracking, and meal suggestions.

## Decisions (from the requirements conversation)

| Topic | Decision |
|---|---|
| Platform | PWA (free, add to home screen, works offline). No native app. |
| Users / data | Two users, completely separate data. |
| Storage | Supabase (email + password auth, Postgres, RLS per user). Local-only mode when no cloud is configured. |
| Logging | Live session mode: exercises in order, kg/reps per set, previous session shown, rest timer. |
| Progression | Manual — the app shows the previous session, it does not suggest weights. |
| Exercise library | free-exercise-db (public domain, ~870 exercises with photos) + optional per-user YouTube link and note. Turkish instructions for program exercises. |
| Programs | Written by us and shipped as a template; editable in the app. |
| Nutrition | Suggestions only, no food logging: daily kcal/macro targets + options per meal slot. |
| Progress | Per-exercise charts and PRs, body weight, body measurements, history + calendar. |

## Program

Shared weekly skeleton (Mon–Fri weights, Sat/Sun optional cardio). Same days and exercises for both people:

- **Güç (strength-first, 10+ years, 60 min):** main lift 5×3–5 (deadlift 5×2–4) with long rest, then hypertrophy accessories; Friday ends with rowing intervals.
- **Sıkılaşma (fat loss + toning, ~1 year, 60 min):** same exercises at lower volume (≈ the 45-minute share of the strength version), 8–15 reps, shorter rest, plus a 12–15 min cardio block every weekday.

## Architecture

- React + Vite + TypeScript, Tailwind, `vite-plugin-pwa` (precache app + exercise DB, runtime-cache exercise images), HashRouter (static hosting on GitHub Pages).
- **Local-first:** every read comes from IndexedDB (Dexie). Every write goes to IndexedDB and an outbox in one transaction. Client-generated UUIDs.
- **Sync:** push outbox → upsert; pull rows with `updated_at` newer than the per-table cursor; newer `updated_at` wins. Soft deletes (`deleted` flag). Triggers: local write (debounced), back online, app visible, every 60 s.
- **Local mode:** rows carry `user_id = 'local'`; on first sign-in they are re-keyed to the account and queued.
- Nutrition targets: Mifflin–St Jeor × 1.55; strength +250 kcal, 2.0 g/kg protein; toning −450 kcal, 1.8 g/kg protein; recalculated from the latest body weight.

## Data model

`profiles, programs, program_days, program_items, exercise_notes, sessions, set_logs, cardio_logs, body_weights, body_measurements` — every row has `id, user_id, updated_at, deleted`. No foreign keys (sync can arrive in any order). Derived values (e1RM, PRs, volume) are computed, not stored.

## Testing

Vitest with fake-indexeddb covers e1RM, weekday mapping, targets, template install for both plans, previous-set lookup, PR detection, progress series, outbox/soft delete, remote merge ordering and local-data adoption. UI verified manually in a mobile viewport.
