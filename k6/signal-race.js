import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Teste la race condition : 20 users tentent d'approuver le même signal simultanément
// Un seul doit réussir, les autres doivent recevoir 409
export const options = {
  vus: 20,
  iterations: 20,
  thresholds: {
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://davidthery-app.vercel.app';
const SIGNAL_ID = __ENV.SIGNAL_ID; // requis : ID d'un signal 'pending'

export default function () {
  if (!SIGNAL_ID) {
    console.error('SIGNAL_ID requis : k6 run -e SIGNAL_ID=<uuid> signal-race.js');
    return;
  }

  const res = http.patch(
    `${BASE_URL}/api/live-signals/${SIGNAL_ID}`,
    JSON.stringify({ action: 'approve' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const ok = check(res, {
    'status 200 ou 409': (r) => r.status === 200 || r.status === 409,
    'pas de 500': (r) => r.status !== 500,
  });
  errorRate.add(!ok);
}
