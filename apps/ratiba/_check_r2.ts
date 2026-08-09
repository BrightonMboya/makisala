import { readFileSync } from 'node:fs';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
const env: Record<string, string> = {};
for (const l of readFileSync(new URL('./.env', import.meta.url), 'utf8').split('\n')) {
  const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
});
for (const prefix of [
  'national-parks/5996c192-edcf-4097-87ca-34881550860b/',
  'national-parks/655c19a3-3fab-4ad4-b778-c1acedcc18a2/',
]) {
  const res = await r2.send(new ListObjectsV2Command({ Bucket: env.R2_BUCKET_NAME, Prefix: prefix }));
  console.log(prefix, '->', (res.Contents ?? []).length, 'objects');
  for (const o of res.Contents ?? []) console.log('  ', o.Key, o.Size);
}
