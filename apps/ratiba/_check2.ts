import { readFileSync } from 'node:fs';
import postgres from 'postgres';
const env: Record<string,string> = {};
for (const l of readFileSync(new URL('./.env', import.meta.url),'utf8').split('\n')) {
  const m=l.match(/^([A-Z0-9_]+)=(.*)$/); if(m) env[m[1]]=m[2].trim().replace(/^["']|["']$/g,'');
}
const sql = postgres(env.DATABASE_URL);
const rows = await sql`SELECT id, name, country, overview_page_id, source FROM national_parks WHERE name ILIKE '%materuni%' OR name ILIKE '%arusha%'`;
for (const r of rows) console.log(JSON.stringify(r));
await sql.end();
