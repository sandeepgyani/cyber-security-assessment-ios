// Creates a MAC_OS review submission for app 6789883521, adds version 1.0, submits.
const crypto = require('crypto'), fs = require('fs'), https = require('https');
const P8 = 'C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8';
const KID = 'AXSWLCWZ9K', ISS = '9ac95791-6854-413d-aca4-3efdc7e535fb';
const APP = '6789883521';
const MAC_VERSION = 'a5fc2935-98ed-4df6-8263-35c097e66081';

function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KID, typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ iss: ISS, iat: now, exp: now + 1100, aud: 'appstoreconnect-v1' })).toString('base64url');
  const sig = crypto.sign('sha256', Buffer.from(h + '.' + p), { key: fs.readFileSync(P8, 'utf8'), dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return h + '.' + p + '.' + sig;
}
const TOKEN = jwt();
function api(method, path, body) {
  return new Promise((res, rej) => {
    const r = https.request({ host: 'api.appstoreconnect.apple.com', path, method, headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' } }, x => {
      let d = ''; x.on('data', c => d += c); x.on('end', () => res({ s: x.statusCode, d: d ? JSON.parse(d) : null }));
    });
    r.on('error', rej); if (body) r.write(JSON.stringify(body)); r.end();
  });
}

(async () => {
  // Existing open submission for MAC_OS?
  const exist = await api('GET', `/v1/reviewSubmissions?filter[app]=${APP}&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW,UNRESOLVED_ISSUES&limit=20`);
  let sub = (exist.d.data || []).find(s => s.attributes.platform === 'MAC_OS');
  if (!sub) {
    const mk = await api('POST', '/v1/reviewSubmissions', {
      data: { type: 'reviewSubmissions', attributes: { platform: 'MAC_OS' },
        relationships: { app: { data: { type: 'apps', id: APP } } } }
    });
    if (mk.s >= 400) { console.log('create submission failed:', JSON.stringify(mk.d.errors)); return; }
    sub = mk.d.data;
  }
  console.log('submission:', sub.id, sub.attributes.state);

  // Add the macOS version as an item (skip if already present)
  const items = await api('GET', `/v1/reviewSubmissions/${sub.id}/items`);
  if (!(items.d.data || []).length) {
    const it = await api('POST', '/v1/reviewSubmissionItems', {
      data: { type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: MAC_VERSION } }
        } }
    });
    console.log('add item:', it.s, it.s >= 400 ? JSON.stringify(it.d.errors) : 'ok');
    if (it.s >= 400) return;
  } else console.log('item already present');

  // Submit
  const go = await api('PATCH', `/v1/reviewSubmissions/${sub.id}`, {
    data: { type: 'reviewSubmissions', id: sub.id, attributes: { submitted: true } }
  });
  console.log('SUBMIT:', go.s, go.s >= 400 ? JSON.stringify(go.d.errors) : JSON.stringify(go.d.data.attributes));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
