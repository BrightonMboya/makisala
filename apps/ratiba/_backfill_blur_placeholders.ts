// One-time backfill: generate a blur-up placeholder (20px, WebP q40, base64
// data URI — same spec as generateBlurPlaceholder() in image-utils.ts) for
// every accommodation_images row that doesn't have one yet, and store it.
//
// Idempotent: only touches rows where blur_data_url IS NULL, so safe to
// re-run (e.g. after an error) without redoing already-backfilled rows.
//
// Usage:
//   bun run _backfill_blur_placeholders.ts          # dry run, no writes
//   bun run _backfill_blur_placeholders.ts --apply   # for real

import { readFileSync } from 'node:fs';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import postgres from 'postgres';
import sharp from 'sharp';

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
const sql = postgres(env.DATABASE_URL!, {
  max: 6,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 5,
});

const CONCURRENCY = 6;
const ROW_TIMEOUT_MS = 20_000;
const APPLY = process.argv.includes('--apply');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const BATCH_LIMIT = limitArg ? Number(limitArg.split('=')[1]) : undefined;

// A stalled R2/DB connection can hang a promise forever with no error — wrap
// each row so one bad connection can't quietly stall a whole worker slot for
// the rest of the run (this is what happened on the first --apply attempt:
// stuck for 35 minutes at 42 seconds of actual CPU time).
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timed out after ${ms}ms: ${label}`)), ms),
    ),
  ]);
}

async function generateBlurPlaceholder(input: Buffer): Promise<string> {
  const buffer = await sharp(input)
    .resize(20, 20, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 40 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

async function runPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function main() {
  console.log(`Mode: ${APPLY ? 'APPLY (writing to DB)' : 'DRY RUN (no writes)'}\n`);

  const rows = await sql<{ id: string; bucket: string; key: string }[]>`
    SELECT id, bucket, key FROM accommodation_images WHERE blur_data_url IS NULL
    ${BATCH_LIMIT ? sql`LIMIT ${BATCH_LIMIT}` : sql``}
  `;
  console.log(`Found ${rows.length} rows missing a blur placeholder.\n`);

  let done = 0;
  let errors = 0;

  await runPool(rows, CONCURRENCY, async (row) => {
    try {
      const got = await withTimeout(
        // Some rows have a stale `bucket` value ("r2" instead of the real bucket
        // name) from a historical bug — the live app already ignores the stored
        // bucket entirely (getPublicUrl() always uses env.R2_BUCKET_NAME), so
        // this does the same instead of trusting row.bucket.
        r2.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: row.key })),
        ROW_TIMEOUT_MS,
        `GetObject ${row.key}`,
      );
      const buffer = Buffer.from(await got.Body!.transformToByteArray());
      const blurDataUrl = await generateBlurPlaceholder(buffer);

      if (APPLY) {
        await withTimeout(
          sql`UPDATE accommodation_images SET blur_data_url = ${blurDataUrl} WHERE id = ${row.id}`,
          ROW_TIMEOUT_MS,
          `UPDATE ${row.id}`,
        );
      }

      done++;
      console.log(`[${done}/${rows.length}] ${row.key}  (${blurDataUrl.length} bytes)`);
    } catch (err) {
      errors++;
      console.error(`[error] ${row.key}:`, err instanceof Error ? err.message : err);
    }
  });

  console.log('\n--- Summary ---');
  console.log(`Backfilled: ${done}/${rows.length} (${errors} errors)`);
  if (!APPLY) {
    console.log('\nDry run only — nothing was written. Re-run with --apply to update the DB.');
  }

  await sql.end();
}

main();
