export async function uploadUnsigned({ file, folder }) {
  const cloud = 'dnxxx8qw8'
  const preset = 'srsjdbqx'
  if (!cloud || !preset) return null

  const endpoint = `https://api.cloudinary.com/v1_1/${cloud}/upload`
  const form = new FormData()
  form.append('upload_preset', preset)
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
  return Boolean(import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME && import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET)
}


