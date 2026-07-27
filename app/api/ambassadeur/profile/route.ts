import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/server';
import { FEATURES } from '@/config/features';
import { sendAmbassadeurModificationAdmin } from '@/lib/email/templates';

export async function PATCH(req: NextRequest) {
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return req.cookies.getAll(); }, setAll() {} } }
  );

  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from('host_profiles')
    .select('id, first_name, city, address_private, consignes, phone, quartier, presentation_message, host_type')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });

  const body = await req.json();
  const { city, lat, lng, country, address_private, consignes, phone, quartier, presentation_message, is_women_only } = body;

  const updates: Record<string, unknown> = {};

  if (address_private !== undefined) updates.address_private = address_private;
  if (consignes !== undefined) updates.consignes = consignes;
  if (phone !== undefined) updates.phone = phone;
  if (quartier !== undefined) updates.quartier = quartier || null;
  if (presentation_message !== undefined) {
    if (typeof presentation_message === 'string' && presentation_message.length > 240) {
      return NextResponse.json({ error: 'Le message de présentation est limité à 240 caractères.' }, { status: 400 });
    }
    updates.presentation_message = presentation_message || null;
  }
  if (is_women_only !== undefined && profile.host_type === 'individual') {
    updates.is_women_only = Boolean(is_women_only);
  }

  const ancienneVille = profile.city;
  let villeChangee = false;

  if (city !== undefined) {
    if (lat == null || lng == null) {
      return NextResponse.json(
        { error: 'Veuillez sélectionner une ville dans la liste pour que les coordonnées soient validées.' },
        { status: 400 }
      );
    }
    updates.city = city;
    updates.lat = lat;
    updates.lng = lng;
    if (country !== undefined) updates.country = country;
    villeChangee = city !== ancienneVille;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from('host_profiles')
    .update(updates)
    .eq('id', profile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (FEATURES.EMAIL_NOTIFICATIONS && villeChangee) {
    const adminEmail = process.env.RESEND_ADMIN_EMAIL;
    if (adminEmail) {
      Promise.allSettled([
        sendAmbassadeurModificationAdmin(
          adminEmail,
          profile.first_name,
          ancienneVille,
          city as string,
        ),
      ]);
    }
  }

  return NextResponse.json({ success: true });
}
