import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  vus: 250,
  duration: '2m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://ambassades-guerison.vercel.app';
const EVENT_ID = __ENV.EVENT_ID || '';

export default function () {
  // Simule le polling 5s du feed admin
  const url = EVENT_ID
    ? `${BASE_URL}/api/live-signals?status=pending&event_id=${EVENT_ID}`
    : `${BASE_URL}/api/live-signals?status=pending`;

  const res = http.get(url);
  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'réponse < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(!ok);
  sleep(5); // simule le polling réel
}
