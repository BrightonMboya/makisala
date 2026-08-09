import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const env: Record<string, string> = {};
for (const l of readFileSync(new URL('./.env', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const BUCKET = env.R2_BUCKET_NAME;
const PUBLIC = env.R2_PUBLIC_URL;
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});

async function fetchRetry(url: string, tries = 4): Promise<Response | null> {
  for (let a = 1; a <= tries; a++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'MakisalaBot/1.0 (contact: info@makisala.com)' } });
      if (r.ok || r.status === 404) return r;
    } catch {}
    await new Promise((res) => setTimeout(res, 500 * a));
  }
  return null;
}

type Candidate = { url: string; name: string };

const MATERUNI_ID = '5996c192-edcf-4097-87ca-34881550860b';
const ARUSHA_ID = '655c19a3-3fab-4ad4-b778-c1acedcc18a2';

const materuniCandidates: Candidate[] = [
  // Official Tanzania Tourism Board gallery
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_01.jpg', name: 'materuni-official-01' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_02.jpg', name: 'materuni-official-02' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_03.jpg', name: 'materuni-official-03' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_04.jpg', name: 'materuni-official-04' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_05.jpg', name: 'materuni-official-05' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_09.jpg', name: 'materuni-official-09' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_15.jpg', name: 'materuni-official-15' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_16.jpg', name: 'materuni-official-16' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_Walking_Path.jpg', name: 'materuni-walking-path-01' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_Walking_Path_06.jpg', name: 'materuni-walking-path-06' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_Walking_Path_07.jpg', name: 'materuni-walking-path-07' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_Walking_Path_11.jpg', name: 'materuni-walking-path-11' },
  { url: 'https://www.tanzaniatourism.com/images/uploads/Materuni_Waterfalls_Walking_Path_14.jpg', name: 'materuni-walking-path-14' },
  // Wikimedia Commons
  { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Materuni1.jpg', name: 'materuni-commons-01' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Materuni2.jpg', name: 'materuni-commons-02' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Materuni_Falls%2C_Uru_mashariki.jpg', name: 'materuni-commons-uru-mashariki' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Materuni_Falls_1.jpg', name: 'materuni-commons-falls-1' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Vodopad_Materuni_u_podno%C5%BEju_Nacionalnoga_parka_Kilimand%C5%BEaro.jpg', name: 'materuni-commons-vodopad' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Night_View_at_Materuni_Village.jpg', name: 'materuni-commons-night-village' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Materuni_Kilimanjaro%2C_muddy_feet_after_a_playful_morning.jpg', name: 'materuni-commons-muddy-feet' },
  // Openverse / Flickr (hiking + coffee tour set)
  { url: 'https://live.staticflickr.com/3851/33713177226_c294667368_b.jpg', name: 'materuni-flickr-01' },
  { url: 'https://live.staticflickr.com/2895/33597743042_991dfa17bc_b.jpg', name: 'materuni-flickr-02' },
  { url: 'https://live.staticflickr.com/3950/33713178636_e43e0c7e1f_b.jpg', name: 'materuni-flickr-03' },
  { url: 'https://live.staticflickr.com/2841/33753898835_c1814ed325_b.jpg', name: 'materuni-flickr-04' },
  { url: 'https://live.staticflickr.com/2871/33713177786_51e1dc3d84_b.jpg', name: 'materuni-flickr-05' },
  { url: 'https://live.staticflickr.com/2834/33624895801_aa2b8bce50_b.jpg', name: 'materuni-flickr-06' },
  { url: 'https://live.staticflickr.com/3817/33713179046_86caa23491_b.jpg', name: 'materuni-flickr-07' },
  { url: 'https://live.staticflickr.com/3829/11066199794_79b59bbe10_b.jpg', name: 'materuni-flickr-08' },
  { url: 'https://live.staticflickr.com/3712/11066171256_9cc266a8af_b.jpg', name: 'materuni-flickr-09' },
];

const arushaCandidates: Candidate[] = [
  // Wikimedia Commons - city landmarks (via Wikipedia "Arusha" article)
  { url: 'https://upload.wikimedia.org/wikipedia/commons/9/97/Arusha_Clocktower.jpg', name: 'arusha-clocktower' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Cathedral_of_Arusha.jpg', name: 'arusha-cathedral' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/b/bf/Central_Bus_Terminal_Arusha_City.jpg', name: 'arusha-bus-terminal' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/7/73/ALMC_Hospital_in_Arusha.jpg', name: 'arusha-almc-hospital' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f3/Regional_Air_Arusha.jpg', name: 'arusha-regional-air' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/UN_International_Residual_Mechanism_for_Criminal_Tribunals%2C_Arusha%2C_Tanzania_%2833469820718%29.jpg', name: 'arusha-un-tribunal' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Arusha_City_view.jpg', name: 'arusha-city-view-01' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/d/df/One_of_the_Arusha_city_view.jpg', name: 'arusha-city-view-02' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Look_at_Mt._Meru_Arusha_Tanzania.jpg', name: 'arusha-mt-meru-view' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Mount_Meru_%283198154149%29.jpg', name: 'arusha-mt-meru-02' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Mount_meru_with_snow%2C_Arusha_Region%2C_Tanzania.jpg', name: 'arusha-mt-meru-snow' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Red_hot_sunset_in_Arusha.jpg', name: 'arusha-sunset-01' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Sunset%2C_Arusha_Tanzania.jpg', name: 'arusha-sunset-02' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Ruas_de_Arusha_Streets_of_Arusha_%284048699175%29.jpg', name: 'arusha-streets' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Mtaa_wa_Arusha_Sokoni.jpg', name: 'arusha-market-street' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/d/da/Naura_Park_Jacaranda%2C_Sekei_Ward.jpg', name: 'arusha-jacaranda-park' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/Themi_Hill_from_Levolosi_Ward.jpg', name: 'arusha-themi-hill' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/4/41/Themi_living_garden.jpg', name: 'arusha-themi-garden' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Meru_view_Moshono_Ward.jpg', name: 'arusha-moshono-meru-view' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Coffee_plantation_in_Tanzania.jpg', name: 'arusha-coffee-plantation' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Arusha_%283198153949%29.jpg', name: 'arusha-general-01' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Arusha_1.jpg', name: 'arusha-general-02' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Arusha%2C_Tanzania_-_panoramio_%282%29.jpg', name: 'arusha-general-03' },
  { url: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Arusha%2C_Tanzania_%28Explored%29_-_Flickr_-_romanboed.jpg', name: 'arusha-street-scene' },
  // Openverse / Flickr
  { url: 'https://live.staticflickr.com/7906/40362815373_8866605325_b.jpg', name: 'arusha-clocktower-supermarket' },
  { url: 'https://live.staticflickr.com/7877/47288529522_17b381cf0d_b.jpg', name: 'arusha-clocktower-circle-01' },
  { url: 'https://live.staticflickr.com/7806/47371536551_f41e108312_b.jpg', name: 'arusha-clocktower-circle-02' },
  { url: 'https://live.staticflickr.com/3415/3240244515_fe650e31af_b.jpg', name: 'arusha-town-01' },
];

function sha256(buf: Buffer) {
  return createHash('sha256').update(buf).digest('hex');
}

async function listExisting(prefix: string) {
  const hashes = new Map<string, string>(); // hash -> key
  let token: string | undefined;
  do {
    const res = await r2.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }),
    );
    for (const obj of res.Contents ?? []) {
      if (!obj.Key) continue;
      const getRes = await fetch(`${PUBLIC}/${obj.Key}`);
      if (getRes.ok) {
        const buf = Buffer.from(await getRes.arrayBuffer());
        hashes.set(sha256(buf), obj.Key);
      }
    }
    token = res.NextContinuationToken;
  } while (token);
  return hashes;
}

async function seed(destId: string, destName: string, candidates: Candidate[]) {
  const prefix = `national-parks/${destId}/`;
  console.log(`\n=== ${destName} (${destId}) ===`);
  const existingHashes = await listExisting(prefix);
  console.log(`Existing objects: ${existingHashes.size}`);

  const seenHashes = new Set(existingHashes.keys());
  let uploaded = 0;
  let skippedDupe = 0;
  let skippedFailed = 0;

  for (const cand of candidates) {
    const res = await fetchRetry(cand.url);
    if (!res || !res.ok) {
      console.log(`FAIL fetch: ${cand.name} (${cand.url})`);
      skippedFailed++;
      continue;
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      console.log(`SKIP not-image: ${cand.name} (${contentType})`);
      skippedFailed++;
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = sha256(buf);
    if (seenHashes.has(hash)) {
      console.log(`SKIP dupe: ${cand.name}`);
      skippedDupe++;
      continue;
    }
    seenHashes.add(hash);
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const key = `${prefix}${cand.name}.${ext}`;
    await r2.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: buf, ContentType: contentType }),
    );
    console.log(`UPLOADED: ${key} (${(buf.length / 1024).toFixed(0)} KB)`);
    uploaded++;
  }

  console.log(`${destName}: uploaded=${uploaded} dupe=${skippedDupe} failed=${skippedFailed}`);
}

process.on('uncaughtException', (e) => console.log('IGNORED uncaughtException:', e?.message));
process.on('unhandledRejection', (e) => console.log('IGNORED unhandledRejection:', e));

await seed(ARUSHA_ID, 'Arusha City', arushaCandidates);
