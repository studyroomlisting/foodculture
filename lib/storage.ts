import { supabase } from './supabase'

const BUCKET = 'listing-images'

export async function uploadListingImage(
  restaurantId: string,
  file: File,
  isPrimary = false
): Promise<{ url: string; path: string } | null> {
  const ext = file.name.split('.').pop()
  const path = `${restaurantId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (uploadError) { console.error(uploadError); return null }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

  // Save reference to listing_images table
  await (supabase as any).from('listing_images').insert([{
    restaurant_id: restaurantId,
    storage_path: path,
    url: publicUrl,
    is_primary: isPrimary,
    sort_order: 0,
  }])

  return { url: publicUrl, path }
}

export async function deleteListingImage(imageId: string, storagePath: string) {
  await supabase.storage.from(BUCKET).remove([storagePath])
  await (supabase as any).from('listing_images').delete().eq('id', imageId)
}

export async function getListingImages(restaurantId: string) {
  const { data } = await supabase
    .from('listing_images')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('sort_order')
  return data ?? []
}
