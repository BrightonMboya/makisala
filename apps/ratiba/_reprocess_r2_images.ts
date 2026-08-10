// One-time batch reprocess: resize+recompress oversized photos already sitting
// in R2, in place. Same spec as the upload-time compressor (client-image-compress.ts
// / image-utils.ts): max 2000px edge, quality 80 — but keeps each file's original
// format/extension/key so no DB row (accommodationImages.key) needs to change.
//
// Defaults to a dry run (reports projected savings, writes nothing). Pass --apply
// to actually overwrite objects in R2.
//
// Usage:
//   bun run _reprocess_r2_images.ts                  # dry run, >1MB
//   bun run _reprocess_r2_images.ts --threshold-mb=2  # dry run, >2MB
//   bun run _reprocess_r2_images.ts --apply           # for real, >1MB

import { readFileSync } from 'node:fs';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
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

const BUCKET = env.R2_BUCKET_NAME;
const MAX_DIMENSION = 2000;
const QUALITY = 80;
const CONCURRENCY = 6;

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const thresholdArg = args.find((a) => a.startsWith('--threshold-mb='));
const THRESHOLD_BYTES = (thresholdArg ? Number(thresholdArg.split('=')[1]) : 1) * 1024 * 1024;

const REENCODE: Record<string, (img: sharp.Sharp) => sharp.Sharp> = {
  jpg: (img) => img.jpeg({ quality: QUALITY, mozjpeg: true }),
  jpeg: (img) => img.jpeg({ quality: QUALITY, mozjpeg: true }),
  png: (img) => img.png({ quality: QUALITY, effort: 8 }),
  webp: (img) => img.webp({ quality: QUALITY }),
};

interface Candidate {
  key: string;
  size: number;
  ext: string;
}

async function listCandidates(): Promise<Candidate[]> {
  const candidates: Candidate[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await r2.send(
      new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 1000, ContinuationToken }),
    );
    for (const obj of res.Contents ?? []) {
      const key = obj.Key ?? '';
      const size = obj.Size ?? 0;
      const ext = key.slice(key.lastIndexOf('.') + 1).toLowerCase();
      if (size > THRESHOLD_BYTES && ext in REENCODE) {
        candidates.push({ key, size, ext });
      }
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return candidates;
}

async function reprocessOne(candidate: Candidate) {
  const got = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: candidate.key }));
  const contentType = got.ContentType;
  const original = Buffer.from(await got.Body!.transformToByteArray());

  const reencode = REENCODE[candidate.ext]!;
  const processed = reencode(
    sharp(original).resize(MAX_DIMENSION, MAX_DIMENSION, {
      fit: 'inside',
      withoutEnlargement: true,
    }),
  );
  const result = await processed.toBuffer();

  if (result.length >= original.length) {
    return { ...candidate, newSize: original.length, skipped: 'no-improvement' as const };
  }

  if (APPLY) {
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: candidate.key,
        Body: result,
        ContentType: contentType,
      }),
    );
  }

  return { ...candidate, newSize: result.length, skipped: null };
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
  console.log(`Mode: ${APPLY ? 'APPLY (writing to R2)' : 'DRY RUN (no writes)'}`);
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Threshold: > ${(THRESHOLD_BYTES / 1024 / 1024).toFixed(1)} MB\n`);

  const candidates = await listCandidates();
  console.log(`Found ${candidates.length} candidate objects.\n`);

  let done = 0;
  let totalBefore = 0;
  let totalAfter = 0;
  let noImprovement = 0;
  let errors = 0;

  const results = await runPool(candidates, CONCURRENCY, async (c) => {
    try {
      const r = await reprocessOne(c);
      done++;
      totalBefore += r.size;
      totalAfter += r.newSize;
      if (r.skipped) noImprovement++;
      const pct = (100 * (1 - r.newSize / r.size)).toFixed(1);
      console.log(
        `[${done}/${candidates.length}] ${r.key}  ${(r.size / 1024 / 1024).toFixed(2)}MB -> ${(r.newSize / 1024 / 1024).toFixed(2)}MB (-${pct}%)${r.skipped ? '  [' + r.skipped + ']' : ''}`,
      );
      return r;
    } catch (err) {
      errors++;
      console.error(`[error] ${c.key}:`, err instanceof Error ? err.message : err);
      return null;
    }
  });

  console.log('\n--- Summary ---');
  console.log(`Processed: ${done}/${candidates.length} (${errors} errors, ${noImprovement} left unchanged)`);
  console.log(`Total before: ${(totalBefore / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Total after:  ${(totalAfter / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Reduction:    ${(100 * (1 - totalAfter / totalBefore)).toFixed(1)}%`);
  if (!APPLY) {
    console.log('\nDry run only — nothing was written. Re-run with --apply to overwrite in R2.');
  }
  void results;
}

main();
