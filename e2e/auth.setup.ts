import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { AMBASSADOR_STATE, SOPHIE_STATE } from './auth-state';

/**
 * Playwright global auth setup
 *
 * Génère un magic link via l'API Supabase admin (sans Resend),
 * navigue dessus pour obtenir une session, et sauvegarde les cookies
 * dans playwright/.auth/ambassador.json.
 *
 * Prérequis : supabase start + node scripts/seed.js (pour avoir marie.dubois@demo.fr)
 */

function loadEnvLocal(): Record<string, string> {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return env;
}

async function generateMagicLink(email: string): Promise<string> {
  const env = loadEnvLocal();
  const BASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const APP_URL = env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!BASE_URL || !SERVICE_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local.\n' +
      'Vérifier que supabase start est lancé et que .env.local est rempli.'
    );
  }

  const res = await fetch(`${BASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', email }),
  });

  const data = await res.json() as Record<string, unknown>;
  if (!res.ok) throw new Error(`Supabase generate_link failed: ${JSON.stringify(data)}`);

  const token = (data.hashed_token ?? (data.properties as Record<string,unknown>)?.hashed_token) as string;
  if (!token) throw new Error(`hashed_token absent : ${JSON.stringify(data)}`);

  return `${APP_URL}/auth/confirm?token_hash=${token}&type=magiclink`;
}

setup('authenticate — marie.dubois@demo.fr (validated ambassador)', async ({ page }) => {
  fs.mkdirSync('playwright/.auth', { recursive: true });

  const magicLink = await generateMagicLink('marie.dubois@demo.fr');
  await page.goto(magicLink);

  // La page /auth/confirm redirige vers /dashboard après succès
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  await page.context().storageState({ path: AMBASSADOR_STATE });
});

setup('authenticate — sophie.leroux@demo.fr (pending_review candidate)', async ({ page }) => {
  fs.mkdirSync('playwright/.auth', { recursive: true });

  const magicLink = await generateMagicLink('sophie.leroux@demo.fr');
  await page.goto(magicLink);

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  await page.context().storageState({ path: SOPHIE_STATE });
});
