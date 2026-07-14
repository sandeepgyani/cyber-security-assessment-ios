// Prepares the macOS App Store listing for app 6789883521:
// copies description/keywords from the iOS version localization, sets review contact.
const crypto = require('crypto'), fs = require('fs'), https = require('https');

const P8 = 'C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8';
const KID = 'AXSWLCWZ9K', ISS = '9ac95791-6854-413d-aca4-3efdc7e535fb';
const APP = '6789883521';

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
  // 1. All versions for the app
  const vers = await api('GET', `/v1/apps/${APP}/appStoreVersions?limit=20&fields[appStoreVersions]=platform,versionString,appStoreState`);
  for (const v of vers.d.data) console.log('version:', v.id, v.attributes.platform, v.attributes.versionString, v.attributes.appStoreState);
  const mac = vers.d.data.find(v => v.attributes.platform === 'MAC_OS');
  const ios = vers.d.data.find(v => v.attributes.platform === 'IOS');
  if (!mac) { console.log('NO MAC VERSION'); return; }

  // 2. iOS localization content (source of truth)
  const iosLoc = await api('GET', `/v1/appStoreVersions/${ios.id}/appStoreVersionLocalizations`);
  const src = iosLoc.d.data[0].attributes;
  console.log('iOS localization found, description length:', (src.description || '').length);

  // 3. macOS localization
  const macLoc = await api('GET', `/v1/appStoreVersions/${mac.id}/appStoreVersionLocalizations`);
  const tgt = macLoc.d.data[0];
  console.log('mac localization:', tgt.id, 'locale', tgt.attributes.locale, 'desc len', (tgt.attributes.description || '').length);

  // 4. Copy fields
  const patch = await api('PATCH', `/v1/appStoreVersionLocalizations/${tgt.id}`, {
    data: { type: 'appStoreVersionLocalizations', id: tgt.id, attributes: {
      description: src.description, keywords: src.keywords,
      supportUrl: src.supportUrl, promotionalText: src.promotionalText || undefined
    } }
  });
  console.log('localization PATCH:', patch.s, patch.s >= 400 ? JSON.stringify(patch.d.errors) : 'ok');

  // 5. Review details (contact info) for the mac version
  const revGet = await api('GET', `/v1/appStoreVersions/${mac.id}/appStoreReviewDetail`);
  const iosRev = await api('GET', `/v1/appStoreVersions/${ios.id}/appStoreReviewDetail`);
  const ra = iosRev.d && iosRev.d.data ? iosRev.d.data.attributes : null;
  console.log('ios review contact:', ra ? ra.contactEmail : 'none');
  if (revGet.d && revGet.d.data) {
    const p2 = await api('PATCH', `/v1/appStoreReviewDetails/${revGet.d.data.id}`, {
      data: { type: 'appStoreReviewDetails', id: revGet.d.data.id, attributes: {
        contactFirstName: ra.contactFirstName, contactLastName: ra.contactLastName,
        contactPhone: ra.contactPhone, contactEmail: ra.contactEmail, notes: ra.notes || ''
      } }
    });
    console.log('review detail PATCH:', p2.s);
  } else {
    const p2 = await api('POST', `/v1/appStoreReviewDetails`, {
      data: { type: 'appStoreReviewDetails', attributes: {
        contactFirstName: ra.contactFirstName, contactLastName: ra.contactLastName,
        contactPhone: ra.contactPhone, contactEmail: ra.contactEmail, notes: ra.notes || ''
      }, relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: mac.id } } } }
    });
    console.log('review detail POST:', p2.s, p2.s >= 400 ? JSON.stringify(p2.d.errors) : 'ok');
  }

  // 6. Check builds for MAC_OS
  const builds = await api('GET', `/v1/builds?filter[app]=${APP}&sort=-uploadedDate&limit=10&fields[builds]=version,processingState,uploadedDate`);
  for (const b of builds.d.data) console.log('build:', b.id, b.attributes.version, b.attributes.processingState, b.attributes.uploadedDate);

  console.log('MAC_VERSION_ID=' + mac.id);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
