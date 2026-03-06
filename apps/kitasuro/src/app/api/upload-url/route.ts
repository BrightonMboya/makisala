import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToStorage } from '@/lib/storage';
import { log } from '@/lib/logger';

const MAX_URLS = 20;

const ALLOWED_HOSTS = ['a0.muscache.com', 'a1.muscache.com'];

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_HOSTS.some(d => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`))
    );
  } catch {
    return false;
  }
}

const FOLDER_PATTERN = /^accommodations\/[a-f0-9-]+$/;

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { urls, folder } = (await req.json()) as {
      urls: string[];
      folder: string;
    };

    if (!urls?.length || urls.length > MAX_URLS) {
      return NextResponse.json(
        { error: `Provide between 1 and ${MAX_URLS} URLs` },
        { status: 400 }
      );
    }

    if (!folder || !FOLDER_PATTERN.test(folder)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }

    const safeUrls = urls.filter(isAllowedImageUrl);
    if (safeUrls.length === 0) {
      return NextResponse.json({ error: 'No allowed URLs provided' }, { status: 400 });
    }

    log.info('URL upload started', {
      userId: session.user.id,
      folder,
      urlCount: safeUrls.length,
    });

    const settled = await Promise.allSettled(
      safeUrls.map(async (url, i) => {
        const response = await fetch(url, { redirect: 'follow' });
        if (!response.ok) {
          log.warn('Failed to download image', { url, status: response.status });
          return null;
        }

        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        const urlPath = new URL(url).pathname;
        const originalName = urlPath.split('/').pop() || 'image.jpg';
        const key = `${folder}/${Date.now()}-${i}-${originalName}`;

        const { bucket, key: storageKey } = await uploadToStorage({
          file: buffer,
          contentType,
          key,
          visibility: 'public',
        });

        return { key: storageKey, bucket };
      })
    );

    const results = settled
      .filter(
        (r): r is PromiseFulfilledResult<{ key: string; bucket: string } | null> =>
          r.status === 'fulfilled'
      )
      .map(r => r.value)
      .filter((r): r is { key: string; bucket: string } => r !== null);

    log.info('URL upload complete', {
      userId: session.user.id,
      folder,
      uploadedCount: results.length,
    });

    return NextResponse.json({ images: results });
  } catch (error) {
    log.error('URL upload failed', {
      userId: session.user.id,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
