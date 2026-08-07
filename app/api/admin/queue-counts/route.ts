import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getActionQueue } from '@/lib/admin/stats-helpers';

// Compteurs pour les badges de la sidebar admin (audit 2026-08-07, T.6).
//
// Sans badge, un signalement urgent ou un questionnaire à valider n'était
// visible qu'en ouvrant la Vue générale — alors que le tableau de bord
// ambassadeur porte déjà un badge sur « Demandes ».
//
// Route dédiée plutôt que prop serveur : `AdminLayout` est un Client Component
// monté par chacune des 10 pages admin, sans layout serveur commun où charger
// la donnée une seule fois.
export async function GET(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;

  const queue = await getActionQueue();

  return NextResponse.json({
    ambassadeurs: queue.questionnairesToReview,
    temoignages: queue.testimonialsPending,
    feedback: queue.feedbackReports,
  });
}
