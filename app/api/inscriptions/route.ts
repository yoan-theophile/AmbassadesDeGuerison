import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmation } from '@/lib/email/templates';
import { FEATURES } from '@/config/features';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Honeypot
  if (body.website) return NextResponse.json({}, { status: 200 });

  const {
    email,
    first_name,
    city,
    country,
    type,
    capacity,
    address_private,
    whatsapp_group_url,
    consignes,
    lat,
    lng,
  } = body;

  if (!email || !first_name || !city || !country || !address_private) {
    return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
  }

  if (lat !== undefined && lat !== null) {
    const latNum = Number(lat);
    if (Number.isNaN(latNum) || latNum < -90 || latNum > 90) {
      return NextResponse.json({ error: 'Latitude invalide (doit être entre -90 et 90).' }, { status: 400 });
    }
  }
  if (lng !== undefined && lng !== null) {
    const lngNum = Number(lng);
    if (Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return NextResponse.json({ error: 'Longitude invalide (doit être entre -180 et 180).' }, { status: 400 });
    }
  }
  if ((lat == null) !== (lng == null)) {
    return NextResponse.json({ error: 'lat et lng doivent être fournis ensemble.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  // createUser + email_confirm: true crée le compte sans envoyer d'email via Supabase Auth.
  // Évite le rate limit (~2-4/h) de inviteUserByEmail. La confirmation passe par Resend ci-dessous.
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { role: 'host' },
  });

  let profileId: string | undefined;

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const user = existingUser?.users.find((u) => u.email === email);
      if (!user) return NextResponse.json({ error: authError.message }, { status: 400 });

      const { data: profileData, error: profileError } = await supabase.from('host_profiles').insert({
        user_id: user.id,
        email,
        first_name,
        city,
        country,
        host_type: type ?? 'individual',
        capacity: capacity ?? 10,
        contact_mode: 'email',
        address_private,
        whatsapp_group_url: whatsapp_group_url || null,
        consignes: consignes || null,
        lat: lat ?? null,
        lng: lng ?? null,
        status: 'pending_review',
      }).select('id').single();
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
      profileId = profileData?.id;
    } else {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
  } else {
    const userId = authData.user?.id;
    if (!userId) return NextResponse.json({ error: 'Erreur création utilisateur.' }, { status: 500 });

    const { data: profileData, error: profileError } = await supabase.from('host_profiles').insert({
      user_id: userId,
      email,
      first_name,
      city,
      country,
      host_type: type ?? 'individual',
      capacity: capacity ?? 10,
      contact_mode: 'email',
      address_private,
      whatsapp_group_url: whatsapp_group_url || null,
      consignes: consignes || null,
      lat: lat ?? null,
      lng: lng ?? null,
      status: 'pending_review',
    }).select('id').single();
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
    profileId = profileData?.id;
  }

  if (FEATURES.EMAIL_NOTIFICATIONS) {
    await sendRegistrationConfirmation(email, first_name).catch(() => {});
  }

  return NextResponse.json({ success: true, id: profileId }, { status: 201 });
}
