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