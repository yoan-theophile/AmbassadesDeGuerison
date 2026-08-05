import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import { compressAmbassadorPhoto } from '@/lib/image/compress-photo';

const BUCKET = 'visitor-photos';
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

function getAnonClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll() {},
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const { data: { user } } = await getAnonClient(req).auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Seules les images sont acceptées' }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from('visitor_profiles')
    .select('photo_url')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'Profil visiteur introuvable' }, { status: 404 });
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());
  let buffer: Buffer;
  try {
    buffer = await compressAmbassadorPhoto(rawBuffer, 'profile');
  } catch {
    return NextResponse.json({ error: 'Image invalide ou illisible' }, { status: 400 });
  }

  const path = `${user.id}/profile-${Date.now()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 900);

  if (signedError) {
    return NextResponse.json({ error: signedError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from('visitor_profiles')
    .update({ photo_url: path })
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Supprime l'ancienne photo du bucket (best-effort, ne bloque jamais la réponse)
  if (profile.photo_url && profile.photo_url !== path) {
    await supabase.storage.from(BUCKET).remove([profile.photo_url]).catch(() => {});
  }

  return NextResponse.json({ url: signedData.signedUrl, path });
}

export async function DELETE(req: NextRequest) {
  const { data: { user } } = await getAnonClient(req).auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const path = (body as { path?: string }).path;

  if (!path) {
    return NextResponse.json({ error: 'path requis' }, { status: 400 });
  }
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Cette photo ne vous appartient pas' }, { status: 403 });
  }

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from('visitor_profiles')
    .select('photo_url')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile || profile.photo_url !== path) {
    return NextResponse.json({ error: 'Photo introuvable sur ce profil' }, { status: 404 });
  }

  const { error } = await supabase
    .from('visitor_profiles')
    .update({ photo_url: null })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.storage.from(BUCKET).remove([path]).catch(() => {});

  return NextResponse.json({ success: true });
}
