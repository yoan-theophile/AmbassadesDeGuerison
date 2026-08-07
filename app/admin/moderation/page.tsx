import { redirect } from 'next/navigation';

// Vestige d'un renommage : cette route pointait vers /admin/live, sans rapport
// avec la modération. Un signet ancien atterrissait sur le feed du live en
// cours (audit admin 2026-08-07, T.9). /admin/feedback est l'écran de
// modération réel — signalements et retours post-live.
export default function AdminModerationPage() {
  redirect('/admin/feedback');
}
