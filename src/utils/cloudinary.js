const CLOUD = import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME || 'dnxxx8qw8'
const PRESET = import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'srsjdbqx'

export async function uploadUnsigned({ file, folder }) {
  if (!CLOUD || !PRESET) return null
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD}/upload`
  const form = new FormData()
  form.append('upload_preset', PRESET)
  if (folder) form.append('folder', folder)
  form.append('file', file)

  const res = await fetch(endpoint, { method: 'POST', body: form })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`)
  }
  return res.json()
}

export function isCloudinaryConfigured() {
  return Boolean(CLOUD && PRESET)
}