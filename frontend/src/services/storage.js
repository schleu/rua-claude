import { supabase } from './supabase'

/**
 * Upload de imagem para o Supabase Storage.
 * Retorna a URL pública do arquivo ou null em caso de erro.
 */
export async function uploadPhoto(file, bucket = 'photos') {
  const ext = file.name.split('.').pop()
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(name, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })

  if (error) {
    console.error('Upload error:', error)
    return null
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(name)
  return data.publicUrl
}

/**
 * Converte File em base64 para preview local imediato.
 */
export function fileToPreview(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}
