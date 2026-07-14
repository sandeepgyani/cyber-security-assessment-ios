// Declares no non-exempt encryption on the Mac build and attaches it to the macOS version.
const crypto = require('crypto'), fs = require('fs'), https = require('https');
const P8 = 'C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8';
const KID = 'AXSWLCWZ9K', ISS = '9ac95791-6854-413d-aca4-3efdc7e535fb';
const BUILD = 'e5ca4f47-5ddf-40d9-ae64-2cb74aced6e5';
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
  const enc = await api('PATCH', `/v1/builds/${BUILD}`, {
    data: { type: 'builds', id: BUILD, attributes: { usesNonExemptEncryption: false } }
  });
  console.log('encryption declaration:', enc.s, enc.s >= 400 ? JSON.stringify(enc.d.errors) : 'ok');

  const att = await api('PATCH', `/v1/appStoreVersions/${MAC_VERSION}/relationships/build`, {
    data: { type: 'builds', id: BUILD }
  });
  console.log('attach build:', att.s, att.s >= 400 ? JSON.stringify(att.d && att.d.errors) : 'ok');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
