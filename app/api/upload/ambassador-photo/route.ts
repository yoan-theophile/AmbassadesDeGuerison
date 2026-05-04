import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';

const BUCKET = 'ambassador-photos';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

export async function POST(req: NextRequest) {
  // Auth via session cookie
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
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string | null; // 'profile' | 'room'

  if (!file || !type) {
    return NextResponse.json({ error: 'Fichier ou type manquant' }, { status: 400 });
  }
  if (!['profile', 'room'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Seules les images sont acceptées' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Récupérer le profil pour construire le chemin
  const { data: profile } = await supabase
    .from('host_profiles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'Profil ambassadeur introuvable' }, { status: 404 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const timestamp = Date.now();
  const path = `${profile.id}/${type}-${timestamp}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Générer une signed URL (15 min) pour l'aperçu immédiat — le chemin est stocké en DB
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 900);

  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 500 });
  }

  const signedUrl = signedData.signedUrl;

  // Mettre à jour la colonne avec le CHEMIN (pas l'URL publique)
  if (type === 'profile') {
    const { error } = await supabase
      .from('host_profiles')
      .update({ profile_photo_url: path })
      .eq('id', profile.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Append dans room_photo_urls[] (max 5 photos)
    const { data: current } = await supabase
      .from('host_profiles')
      .select('room_photo_urls')
      .eq('id', profile.id)
      .single();

    const existing: string[] = current?.room_photo_urls ?? [];
    if (existing.length >= 5) {
      return NextResponse.json({ error: 'Maximum 5 photos de salle atteint' }, { status: 400 });
    }

    const { error } = await supabase
      .from('host_profiles')
      .update({ room_photo_urls: [...existing, path] })
      .eq('id', profile.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // url = signed URL pour aperçu immédiat dans le dashboard, path = chemin stocké en DB
  return NextResponse.json({ url: signedUrl, path });
}
