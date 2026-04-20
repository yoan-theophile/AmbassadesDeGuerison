import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 50 },   // montée
    { duration: '1m', target: 200 },   // charge nominale
    { duration: '30s', target: 500 },  // pic d'arrivée live
    { duration: '30s', target: 0 },    // descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% des requêtes < 500ms
    errors: ['rate<0.01'],             // < 1% d'erreurs
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://davidthery-app.vercel.app';

export default function () {
  // Chargement initial de la carte
  const res = http.get(`${BASE_URL}/api/host-activations`);
  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'réponse < 500ms': (r) => r.timings.duration < 500,
    'body JSON valide': (r) => {
      try { JSON.parse(r.body); return true; } catch { return false; }
    },
  });
  errorRate.add(!ok);
  sleep(1);
}
