-- Migration : ajout de created_at sur host_activations
-- Requis par le dashboard (order by created_at desc) — retournait 400 sans cette colonne.
-- Usage : supabase db query --linked --file scripts/migration-host-activations-created-at.sql

ALTER TABLE host_activations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
