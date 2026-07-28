import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import { compressAmbassadorPhoto } from '@/lib/image/compress-photo';

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

  const timestamp = Date.now();
  const path = `${profile.id}/${type}-${timestamp}.webp`;

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  let buffer: Buffer;
  try {
    buffer = await compressAmbassadorPhoto(rawBuffer, type as 'profile' | 'room');
  } catch {
    return NextResponse.json({ error: 'Image invalide ou illisible' }, { status: 400 });
  }

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'image/webp',
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

export async function DELETE(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));
  const path = (body as { path?: string }).path;
  const type = (body as { type?: string }).type;

  if (!path || !type) {
    return NextResponse.json({ error: 'path et type requis' }, { status: 400 });
  }
  if (!['profile', 'room'].includes(type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Vérifie que la photo appartient bien au profil de l'utilisateur (ownership check)
  const { data: profile } = await supabase
    .from('host_profiles')
    .select('id, profile_photo_url, room_photo_urls')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'Profil ambassadeur introuvable' }, { status: 404 });
  }
  if (!path.startsWith(`${profile.id}/`)) {
    return NextResponse.json({ error: 'Cette photo ne vous appartient pas' }, { status: 403 });
  }

  if (type === 'profile') {
    if (profile.profile_photo_url !== path) {
      return NextResponse.json({ error: 'Photo introuvable sur ce profil' }, { status: 404 });
    }
    const { error } = await supabase
      .from('host_profiles')
      .update({ profile_photo_url: null })
      .eq('id', profile.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const existing: string[] = profile.room_photo_urls ?? [];
    if (!existing.includes(path)) {
      return NextResponse.json({ error: 'Photo introuvable sur ce profil' }, { status: 404 });
    }
    const { error } = await supabase
      .from('host_profiles')
      .update({ room_photo_urls: existing.filter((p) => p !== path) })
      .eq('id', profile.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Supprime le fichier du bucket (best-effort, on ne bloque pas si échec)
  await supabase.storage.from(BUCKET).remove([path]).catch(() => {});

  return NextResponse.json({ success: true });
}
