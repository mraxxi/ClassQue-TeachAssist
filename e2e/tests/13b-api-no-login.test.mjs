// e2e: no-login
// No Cloudflare Access login and no DEV_USER_EMAIL: the API must not guess a teacher (fails closed).
import { api, check, done } from '../lib.mjs';

let r = await api('/api/me');
check('L1 /api/me without a login is 401 "unauthenticated"', r.status === 401 && r.json?.status === 'unauthenticated', JSON.stringify(r.json));
r = await api('/api/sync');
check('L2 GET /api/sync without a login is 401 and returns no data', r.status === 401 && r.json?.status === 'unauthenticated' && !r.json?.data, JSON.stringify(r.json));
r = await api('/api/sync', { method: 'POST', body: { cohorts: [{ id: 'x', name: 'x' }] } });
check('L3 POST /api/sync without a login is 401', r.status === 401 && r.json?.status === 'unauthenticated', JSON.stringify(r.json));
done();
