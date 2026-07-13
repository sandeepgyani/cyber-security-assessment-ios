// Creates the Mac Catalyst App Store provisioning profile and Mac Installer Distribution certificate
const crypto = require('crypto'); const fs = require('fs'); const https = require('https');
const KEY_ID='AXSWLCWZ9K', P8='C:/Users/sande/Downloads/AuthKey_AXSWLCWZ9K.p8', ISSUER=process.argv[2];
const BUNDLE='com.pcssolutions.complianceapp';
function jwt(){const h=Buffer.from(JSON.stringify({alg:'ES256',kid:KEY_ID,typ:'JWT'})).toString('base64url');
const n=Math.floor(Date.now()/1000);const p=Buffer.from(JSON.stringify({iss:ISSUER,iat:n,exp:n+900,aud:'appstoreconnect-v1'})).toString('base64url');
const s=crypto.sign('sha256',Buffer.from(h+'.'+p),{key:fs.readFileSync(P8,'utf8'),dsaEncoding:'ieee-p1363'}).toString('base64url');return h+'.'+p+'.'+s;}
function api(m,path,body){return new Promise((res,rej)=>{const r=https.request({hostname:'api.appstoreconnect.apple.com',path,method:m,headers:{Authorization:'Bearer '+jwt(),'Content-Type':'application/json'}},x=>{let d='';x.on('data',c=>d+=c);x.on('end',()=>res({status:x.statusCode,body:d?JSON.parse(d):{}}));});r.on('error',rej);if(body)r.write(JSON.stringify(body));r.end();});}
(async()=>{
 // 1. Mac Installer Distribution certificate from local CSR
 const csr=fs.readFileSync('mac-signing/installer.csr','utf8');
 let r=await api('POST','/v1/certificates',{data:{type:'certificates',attributes:{certificateType:'MAC_INSTALLER_DISTRIBUTION',csrContent:csr}}});
 if(r.status>=300){ console.log('installer cert: ERR', JSON.stringify(r.body.errors).slice(0,300)); }
 else {
   fs.writeFileSync('mac-signing/installer.cer', Buffer.from(r.body.data.attributes.certificateContent,'base64'));
   console.log('installer cert: OK', r.body.data.id, r.body.data.attributes.name);
 }
 // 2. bundle ID id
 r=await api('GET','/v1/bundleIds?filter[identifier]='+BUNDLE);
 const bid=r.body.data.find(b=>b.attributes.identifier===BUNDLE);
 console.log('bundle id:', bid.id);
 // 3. distribution cert (Apple Distribution covers Catalyst)
 r=await api('GET','/v1/certificates?filter[certificateType]=DISTRIBUTION&limit=10');
 const cert=(r.body.data||[]).filter(c=>new Date(c.attributes.expirationDate)>new Date())[0];
 console.log('dist cert:', cert.id, cert.attributes.name);
 // 4. Mac Catalyst App Store profile
 r=await api('POST','/v1/profiles',{data:{type:'profiles',attributes:{name:'pcs catalyst appstore profile',profileType:'MAC_CATALYST_APP_STORE'},relationships:{bundleId:{data:{type:'bundleIds',id:bid.id}},certificates:{data:[{type:'certificates',id:cert.id}]}}}});
 if(r.status>=300){ console.log('catalyst profile: ERR', JSON.stringify(r.body.errors).slice(0,300)); }
 else {
   fs.writeFileSync('mac-signing/pcs_catalyst_profile.mobileprovision', Buffer.from(r.body.data.attributes.profileContent,'base64'));
   console.log('catalyst profile: OK', r.body.data.attributes.uuid);
 }
})().catch(e=>{console.error(e);process.exit(1);});
