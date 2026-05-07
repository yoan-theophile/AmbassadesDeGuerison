// Tracking simple : log structured stdout à chaque ouverture d'une page admin.
// Vercel logs queryable. Pas de table DB en V1 — bascule vers table possible
// en PR séparée si l'analyse manuelle des logs devient pénible.
//
// Best-effort : ne doit jamais bloquer le render. Toute exception est avalée.

export function logPageView(adminId: string, path: string): void {
  try {
    const payload = {
      event: 'admin_page_view',
      admin_id: adminId,
      path,
      ts: new Date().toISOString(),
    };
    console.log(JSON.stringify(payload));
  } catch {
    // Swallow — tracking ne doit jamais casser le render.
  }
}
