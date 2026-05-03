-- Migration v0.1.4.0
-- Appliquer sur la DB liée : supabase db query --linked --file scripts/migration-v0140.sql

-- 1. Colonne idempotence pour le cron send-feedback-emails
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS feedback_sent BOOLEAN DEFAULT FALSE;

-- 2. Seuil "soon" configurable (remplace le hardcode daysUntilNext <= 2 dans MapPublique.tsx)
ALTER TABLE event_timing_config
  ADD COLUMN IF NOT EXISTS soon_threshold_days INTEGER DEFAULT 2;
