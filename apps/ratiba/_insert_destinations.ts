import { readFileSync } from 'node:fs';
import postgres from 'postgres';
const env: Record<string,string> = {};
for (const l of readFileSync(new URL('./.env', import.meta.url),'utf8').split('\n')) {
  const m=l.match(/^([A-Z0-9_]+)=(.*)$/); if(m) env[m[1]]=m[2].trim().replace(/^["']|["']$/g,'');
}
const sql = postgres(env.DATABASE_URL);

const rows = [
  { name: 'Materuni Waterfalls', country: 'Tanzania', lat: '-3.2503', lng: '37.4001' },
  { name: 'Arusha City', country: 'Tanzania', lat: '-3.3869', lng: '36.6830' },
];

for (const r of rows) {
  const existing = await sql`SELECT id, name FROM national_parks WHERE name ILIKE ${r.name}`;
  if (existing.length > 0) {
    console.log('SKIP (exists):', r.name, existing[0]);
    continue;
  }
  const [created] = await sql`
    INSERT INTO national_parks (name, country, latitude, longitude, source, "updatedAt")
    VALUES (${r.name}, ${r.country}, ${r.lat}, ${r.lng}, 'catalog', CURRENT_TIMESTAMP)
    RETURNING id, name
  `;
  console.log('CREATED:', created);
}

await sql.end();
