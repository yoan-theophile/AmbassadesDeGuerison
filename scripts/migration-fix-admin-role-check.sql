-- Corrige la contrainte CHECK sur admin_users.role : le schéma original
-- n'autorisait que ('super_admin', 'moderator'), mais l'UI/API de gestion
-- d'équipe (POST /api/admin/team) envoient toujours 'admin' pour le rôle
-- non-super-admin — 'moderator' n'est référencé nulle part ailleurs dans
-- le code. Résultat : ajouter un membre "Admin" échouait systématiquement
-- avec un 500 (violation de contrainte, message Postgres brut affiché
-- dans l'UI).
--
-- Trouvé par /qa le 2026-07-28. Voir aussi ISSUE-006 (page.tsx sélectionnait
-- une colonne "created_at" inexistante — la table utilise "added_at" — ce
-- qui masquait même les membres existants, silencieusement).
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_role_check;
ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check CHECK (role IN ('super_admin', 'admin'));
