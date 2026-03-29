import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadToStorage } from '@/lib/storage';
import { log } from '@/lib/logger';

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const folder = (formData.get('folder') as string) || 'uploads';

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    log.info('Upload started', {
      userId: session.user.id,
      folder,
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
    });

    const results: { key: string; bucket: string }[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = `${folder}/${Date.now()}-${file.name}`;

      const { bucket, key: storageKey } = await uploadToStorage({
        file: buffer,
        contentType: file.type,
        key,
        visibility: 'public',
      });

      results.push({ key: storageKey, bucket });
    }

    log.info('Upload complete', {
      userId: session.user.id,
      folder,
      uploadedCount: results.length,
    });

    return NextResponse.json({ images: results });
  } catch (error) {
    log.error('Upload failed', {
      userId: session.user.id,
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error),
    });
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
