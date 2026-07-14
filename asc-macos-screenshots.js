// Uploads 3 Mac screenshots (2560x1600) to the macOS version localization.
const crypto = require('crypto'), fs = require('fs'), https = require('https');
const P8 = 'C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8';
const KID = 'AXSWLCWZ9K', ISS = '9ac95791-6854-413d-aca4-3efdc7e535fb';
const LOC = '55264468-80f0-4812-943c-4282fd017d60'; // macOS en-US localization
const DIR = 'C:/Project Cab/CyberSecurityAssessment-iOS/mac-store-assets';
const FILES = ['mac1.png', 'mac2.png', 'mac3.png'];

function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KID, typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ iss: ISS, iat: now, exp: now + 1190, aud: 'appstoreconnect-v1' })).toString('base64url');
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
function putChunk(op, buf) {
  const u = new URL(op.url);
  const headers = {};
  for (const h of op.requestHeaders || []) headers[h.name] = h.value;
  headers['Content-Length'] = buf.length;
  return new Promise((res, rej) => {
    const r = https.request({ host: u.host, path: u.pathname + u.search, method: op.method, headers }, x => {
      let d = ''; x.on('data', c => d += c); x.on('end', () => res(x.statusCode));
    });
    r.on('error', rej); r.write(buf); r.end();
  });
}

(async () => {
  // 1. Find or create the APP_DESKTOP screenshot set
  const sets = await api('GET', `/v1/appStoreVersionLocalizations/${LOC}/appScreenshotSets`);
  let set = (sets.d.data || []).find(s => s.attributes.screenshotDisplayType === 'APP_DESKTOP');
  if (!set) {
    const mk = await api('POST', '/v1/appScreenshotSets', {
      data: { type: 'appScreenshotSets', attributes: { screenshotDisplayType: 'APP_DESKTOP' },
        relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: LOC } } } }
    });
    if (mk.s >= 400) { console.log('set create failed', JSON.stringify(mk.d.errors)); return; }
    set = mk.d.data;
  }
  console.log('screenshot set:', set.id);

  // 2. Upload each file: reserve -> PUT chunks -> commit with md5
  for (const f of FILES) {
    const buf = fs.readFileSync(DIR + '/' + f);
    const rsv = await api('POST', '/v1/appScreenshots', {
      data: { type: 'appScreenshots', attributes: { fileName: f, fileSize: buf.length },
        relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } } }
    });
    if (rsv.s >= 400) { console.log(f, 'reserve failed', JSON.stringify(rsv.d.errors)); continue; }
    const shot = rsv.d.data;
    for (const op of shot.attributes.uploadOperations) {
      const code = await putChunk(op, buf.slice(op.offset, op.offset + op.length));
      if (code >= 300) console.log(f, 'chunk PUT', code);
    }
    const md5 = crypto.createHash('md5').update(buf).digest('hex');
    const com = await api('PATCH', `/v1/appScreenshots/${shot.id}`, {
      data: { type: 'appScreenshots', id: shot.id, attributes: { uploaded: true, sourceFileChecksum: md5 } }
    });
    console.log(f, 'committed:', com.s);
  }

  // 3. Verify states
  const chk = await api('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots?fields[appScreenshots]=fileName,assetDeliveryState`);
  for (const s of chk.d.data) console.log('state:', s.attributes.fileName, JSON.stringify(s.attributes.assetDeliveryState && s.attributes.assetDeliveryState.state));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
