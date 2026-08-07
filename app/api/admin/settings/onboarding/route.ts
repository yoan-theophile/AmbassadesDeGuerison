import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import { normalizeYoutubeEmbedUrl } from '@/lib/youtube';

export async function PATCH(req: NextRequest) {
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }
  if (user.user_metadata?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const body = await req.json();
  const { video_url, pdf_url } = body;

  if (typeof video_url !== 'string' || typeof pdf_url !== 'string') {
    return NextResponse.json({ error: 'Champs invalides.' }, { status: 400 });
  }

  // Normalisation vers la forme embed : coller l'URL de la barre d'adresse
  // YouTube (`watch?v=…`) était accepté sans broncher mais cassait l'iframe du
  // dashboard candidat — et donc la video gate qui conditionne la checkbox
  // d'engagement (audit admin 2026-08-07, 9.5).
  let normalizedVideoUrl = video_url.trim();
  if (normalizedVideoUrl) {
    const embed = normalizeYoutubeEmbedUrl(normalizedVideoUrl);
    if (!embed) {
      return NextResponse.json(
        { error: "Lien YouTube non reconnu. Collez l'adresse de la vidéo (youtube.com/watch?v=… ou youtu.be/…)." },
        { status: 400 }
      );
    }
    normalizedVideoUrl = embed;
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('onboarding_config')
    .upsert({ id: 1, video_url: normalizedVideoUrl, pdf_url: pdf_url.trim(), updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // L'appelant réaffiche l'URL normalisée : l'admin voit ce qui a été enregistré.
  return NextResponse.json({ ok: true, video_url: normalizedVideoUrl });
}
