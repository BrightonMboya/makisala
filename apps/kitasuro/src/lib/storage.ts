import { createClient } from '@supabase/supabase-js'


export type StorageVisibility = 'public' | 'private'

export interface UploadResult {
  bucket: string
  key: string
  publicUrl?: string
}

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use a service key for server-side uploads
)


interface UploadToStorageParams {
  file: Buffer | Uint8Array | Blob
  contentType: string
  key: string
  visibility: StorageVisibility
}

export async function uploadToStorage({
  file,
  contentType,
  key,
  visibility,
}: UploadToStorageParams): Promise<UploadResult> {
  const bucket =
    visibility === 'public'
      ? process.env.SUPABASE_PUBLIC_BUCKET || 'public-assets'
      : process.env.SUPABASE_PRIVATE_BUCKET || 'private-assets'

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(key, file, { contentType, upsert: true })

  if (error) {
    console.error('Storage upload failed:', error)
    throw error
  }

  const result: UploadResult = { bucket, key }

  // If public, generate a public URL
  if (visibility === 'public') {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(key)
    result.publicUrl = urlData.publicUrl
  }

  return result
}

export function getPublicUrl(bucket: string, key: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(key)
  return data.publicUrl
}

export interface StorageFolder {
  name: string
  path: string
}

export interface StorageImage {
  id: string
  name: string
  url: string
}

/**
 * List folders in a Supabase storage bucket
 * Supabase doesn't have native folder support, so we extract unique prefixes from file paths
 */
export async function listStorageFolders(
  bucket: string,
  parentPath?: string
): Promise<StorageFolder[]> {
  const path = parentPath || ''

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    })

  if (error) {
    console.error('Error listing storage folders:', error)
    return []
  }

  // Filter to only include folders (items with null metadata)
  const folders = (data || [])
    .filter((item) => item.id === null) // Folders have null id in Supabase
    .map((item) => ({
      name: item.name,
      path: path ? `${path}/${item.name}` : item.name,
    }))

  return folders
}

/**
 * List images in a Supabase storage bucket folder
 */
export async function listStorageImages(
  bucket: string,
  folderPath?: string
): Promise<StorageImage[]> {
  const path = folderPath || ''

  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: 50,
      sortBy: { column: 'created_at', order: 'desc' },
    })

  if (error) {
    console.error('Error listing storage images:', error)
    return []
  }

  // Filter to only include files (not folders) that are images
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
  const images = (data || [])
    .filter((item) => {
      if (item.id === null) return false // Skip folders
      const dotIndex = item.name.lastIndexOf('.')
      if (dotIndex === -1) return false // No extension
      const ext = item.name.toLowerCase().slice(dotIndex)
      return imageExtensions.includes(ext)
    })
    .map((item) => {
      const fullPath = path ? `${path}/${item.name}` : item.name
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fullPath)
      return {
        id: item.id || fullPath,
        name: item.name,
        url: urlData.publicUrl,
      }
    })

  return images
}