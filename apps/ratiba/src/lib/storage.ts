import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import { cfImage, type CfImageOptions } from './cf-image';

export type StorageVisibility = 'public' | 'private';

export interface UploadResult {
  bucket: string;
  key: string;
  publicUrl?: string;
}

// Initialize R2 client
export const r2 = new S3Client({
  region: 'auto',
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

interface UploadToStorageParams {
  file: Buffer | Uint8Array | Blob;
  contentType: string;
  key: string;
  visibility: StorageVisibility;
}

export async function uploadToStorage({
  file,
  contentType,
  key,
}: UploadToStorageParams): Promise<UploadResult> {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    throw new Error(`Invalid content type: ${contentType}`);
  }

  const body = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;

  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  const result: UploadResult = {
    bucket: env.R2_BUCKET_NAME,
    key,
    publicUrl: `${env.R2_PUBLIC_URL}/${key}`,
  };

  return result;
}

export function getPublicUrl(_bucket: string, key: string, options?: CfImageOptions) {
  const rawUrl = `${env.R2_PUBLIC_URL}/${key}`;
  return cfImage(rawUrl, options);
}


interface UploadPdfParams {
  file: Buffer | Uint8Array;
  key: string;
}

export async function uploadPdfToStorage({ file, key }: UploadPdfParams): Promise<UploadResult> {
  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: 'application/pdf',
    }),
  );
  return { bucket: env.R2_BUCKET_NAME, key };
}

export const ALLOWED_UPLOAD_CONTENT_TYPES = ALLOWED_CONTENT_TYPES;

/**
 * Presigned PUT URL so the browser can upload a file straight to R2, bypassing
 * the serverless request-body size limit (the cause of "Payload too large" on
 * multi-image uploads). The client PUTs the raw file to this URL.
 */
export async function getSignedUploadUrl({
  key,
  contentType,
  expiresInSeconds = 600,
}: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ url: string; key: string; bucket: string }> {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    throw new Error(`Invalid content type: ${contentType}`);
  }
  const url = await getSignedUrl(
    r2,
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: expiresInSeconds },
  );
  return { url, key, bucket: env.R2_BUCKET_NAME };
}

export async function getSignedDownloadUrl(
  key: string,
  options: { expiresInSeconds?: number; downloadAs?: string } = {},
): Promise<string> {
  const { expiresInSeconds = 300, downloadAs } = options;
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: downloadAs
        ? `attachment; filename="${downloadAs.replace(/"/g, '')}"`
        : undefined,
    }),
    { expiresIn: expiresInSeconds },
  );
}

export async function deleteFromStorage(key: string): Promise<void> {
  await r2.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    })
  );
}

export interface StorageFolder {
  name: string;
  path: string;
}

export interface StorageImage {
  id: string;
  name: string;
  url: string;
}

/**
 * List folders in R2 bucket by extracting unique prefixes from file paths
 */
export async function listStorageFolders(
  _bucket: string,
  parentPath?: string
): Promise<StorageFolder[]> {
  const prefix = parentPath ? `${parentPath}/` : '';

  const response = await r2.send(
    new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      Prefix: prefix,
      Delimiter: '/',
    })
  );

  const folders: StorageFolder[] = [];

  if (response.CommonPrefixes) {
    for (const commonPrefix of response.CommonPrefixes) {
      const fullPath = commonPrefix.Prefix ?? '';
      // Remove trailing slash and get the folder name
      const pathWithoutTrailingSlash = fullPath.endsWith('/')
        ? fullPath.slice(0, -1)
        : fullPath;
      const name = pathWithoutTrailingSlash.split('/').pop() || '';

      if (name) {
        folders.push({
          name,
          path: pathWithoutTrailingSlash,
        });
      }
    }
  }

  return folders.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * List images in an R2 bucket folder
 */
export async function listStorageImages(
  _bucket: string,
  folderPath?: string
): Promise<StorageImage[]> {
  const prefix = folderPath ? `${folderPath}/` : '';

  const response = await r2.send(
    new ListObjectsV2Command({
      Bucket: env.R2_BUCKET_NAME,
      Prefix: prefix,
      Delimiter: '/',
    })
  );

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];

  const images: StorageImage[] = [];

  if (response.Contents) {
    for (const item of response.Contents) {
      const key = item.Key ?? '';
      const name = key.split('/').pop() || '';

      // Skip if it's a "folder" marker or doesn't have an image extension
      if (!name || name === '') continue;

      const ext = name.toLowerCase().slice(name.lastIndexOf('.'));
      if (!imageExtensions.includes(ext)) continue;

      images.push({
        id: key,
        name,
        url: cfImage(`${env.R2_PUBLIC_URL}/${key}`),
      });
    }
  }

  return images;
}
