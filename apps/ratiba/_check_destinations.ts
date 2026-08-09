import { readFileSync } from 'node:fs';
import postgres from 'postgres';
const env: Record<string,string> = {};
for (const l of readFileSync(new URL('./.env', import.meta.url),'utf8').split('\n')) {
  const m=l.match(/^([A-Z0-9_]+)=(.*)$/); if(m) env[m[1]]=m[2].trim().replace(/^["']|["']$/g,'');
}
const sql = postgres(env.DATABASE_URL);

const rows = await sql`SELECT id, name, country, latitude, longitude, overview_page_id, source FROM national_parks ORDER BY name`;
console.log('Total rows:', rows.length);
for (const r of rows) {
  console.log(r.name, '|', r.country, '|', r.latitude, r.longitude, '| overview_page_id:', r.overview_page_id, '| source:', r.source);
}
await sql.end();
