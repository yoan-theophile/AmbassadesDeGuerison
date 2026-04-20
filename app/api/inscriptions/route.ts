import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendRegistrationConfirmation } from '@/lib/email/templates';
import { FEATURES } from '@/config/features';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    email,
    first_name,
    city,
    country,
    type,
    capacity,
    contact_mode,
    address_private,
    whatsapp_group_url,
    consignes,
    lat,
    lng,
  } = body;

  if (!email || !first_name || !city || !country || !address_private) {
    return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { role: 'host' },
  });

  if (authError) {
    if (authError.message.includes('already been registered')) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const user = existingUser?.users.find((u) => u.email === email);
      if (!user) return NextResponse.json({ error: authError.message }, { status: 400 });

      const { error: profileError } = await supabase.from('host_profiles').insert({
        user_id: user.id,
        email,
        first_name,
        city,
        country,
        type: type ?? 'domicile',
        capacity: capacity ?? 10,
        contact_mode: contact_mode ?? 'email',
        address_private,
        whatsapp_group_url: whatsapp_group_url || null,
        consignes: consignes || null,
        lat: lat ?? null,
        lng: lng ?? null,
        status: 'pending',
      });
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
    } else {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
  } else {
    const userId = authData.user?.id;
    if (!userId) return NextResponse.json({ error: 'Erreur création utilisateur.' }, { status: 500 });

    const { error: profileError } = await supabase.from('host_profiles').insert({
      user_id: userId,
      email,
      first_name,
      city,
      country,
      type: type ?? 'domicile',
      capacity: capacity ?? 10,
      contact_mode: contact_mode ?? 'email',
      address_private,
      whatsapp_group_url: whatsapp_group_url || null,
      consignes: consignes || null,
      lat: lat ?? null,
      lng: lng ?? null,
      status: 'pending',
    });
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (FEATURES.EMAIL_NOTIFICATIONS) {
    await sendRegistrationConfirmation(email, first_name).catch(() => {});
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
