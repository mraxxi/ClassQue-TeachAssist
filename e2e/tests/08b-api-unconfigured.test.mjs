// e2e: no-token
// W2 — the edge API fails CLOSED when SYNC_TOKEN is not configured on the server.
import { api, check, done } from '../lib.mjs';

let r = await api('/api/sync');
check('U1 server without SYNC_TOKEN refuses GET (503)', r.status === 503 && r.json?.status === 'unconfigured', `${r.status} ${JSON.stringify(r.json)}`);
r = await api('/api/sync', { method: 'POST', body: { teacher: { id: 't', name: 'x' } } });
check('U2 server without SYNC_TOKEN refuses POST (503)', r.status === 503);
r = await api('/api/sync', { token: null });
check('U3 no Authorization header also refused', r.status === 503);
done();
