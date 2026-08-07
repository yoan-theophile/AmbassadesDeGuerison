// Helper d'appel API partagé par tous les écrans admin.
//
// Motivation (audit admin 2026-08-07, T.2) : 4 composants sur 6 utilisaient le
// pattern `if (res.ok) { ... }` sans branche `else`. Quand l'API répondait 400
// ou 403 avec un message pourtant explicite, le bouton ne faisait rien du tout
// — indiscernable d'un bug pour un utilisateur non technique.
//
// Toute écriture admin passe désormais par ici : le message d'erreur remonté
// par l'API est systématiquement disponible pour affichage.

export type ApiResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const GENERIC_ERROR = 'Une erreur est survenue. Réessayez dans un instant.';

export async function apiCall<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown } = {}
): Promise<ApiResult<T>> {
  const { method = 'POST', body } = options;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    // Réseau coupé, requête annulée : l'API n'a jamais répondu.
    return { ok: false, error: 'Connexion impossible. Vérifiez votre accès à Internet.' };
  }

  // Une réponse d'erreur peut ne pas être du JSON (502 HTML d'un proxy, 504…).
  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const fromApi =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error ?? '')
        : '';
    return { ok: false, error: fromApi.trim() || GENERIC_ERROR };
  }

  return { ok: true, data: payload as T };
}
