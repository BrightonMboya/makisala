import { S3Client } from 'bun';
import { env } from './env';

export type StorageVisibility = 'public' | 'private';

export interface UploadResult {
  bucket: string;
  key: string;
  publicUrl?: string;
}

// Initialize R2 client
const r2 = new S3Client({
  accessKeyId: env.R2_ACCESS_KEY_ID,
  secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  bucket: env.R2_BUCKET_NAME,
});

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
  await r2.write(key, file, { type: contentType });

  const result: UploadResult = {
    bucket: env.R2_BUCKET_NAME,
    key,
    publicUrl: `${env.R2_PUBLIC_URL}/${key}`,
  };

  return result;
}

export function getPublicUrl(_bucket: string, key: string) {
  // Bucket param kept for backwards compatibility but ignored - R2 uses single bucket
  return `${env.R2_PUBLIC_URL}/${key}`;
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

  // Use S3 list with delimiter to get "folders"
  const response = await r2.list({
    prefix,
    delimiter: '/',
  });

  // CommonPrefixes contains the "folder" paths
  const folders: StorageFolder[] = [];

  if (response.commonPrefixes) {
    for (const commonPrefix of response.commonPrefixes) {
      const fullPath = commonPrefix.prefix;
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

  const response = await r2.list({
    prefix,
    delimiter: '/',
  });

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];

  const images: StorageImage[] = [];

  if (response.contents) {
    for (const item of response.contents) {
      const key = item.key;
      const name = key.split('/').pop() || '';

      // Skip if it's a "folder" marker or doesn't have an image extension
      if (!name || name === '') continue;

      const ext = name.toLowerCase().slice(name.lastIndexOf('.'));
      if (!imageExtensions.includes(ext)) continue;

      images.push({
        id: key,
        name,
        url: `${env.R2_PUBLIC_URL}/${key}`,
      });
    }
  }

  return images;
}
