// Cloudinary configuration
// Get these from your Cloudinary dashboard: https://cloudinary.com/console
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnxxx8qw8'
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'srsjdbqx'

// Cloudinary upload endpoint
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

/**
 * Upload an image file to Cloudinary
 * @param {File} file - The image file to upload
 * @param {Object} options - Upload options
 * @param {number} options.maxDimension - Maximum dimension for resizing (default: 800)
 * @param {number} options.quality - JPEG quality 0-100 (default: 70, will be converted to 0-1)
 * @returns {Promise<string>} The Cloudinary URL of the uploaded image
 */
export async function uploadToCloudinary(file, options = {}) {
  const { maxDimension = 800, quality: qualityPercent = 70 } = options
  // Convert quality from 0-100 to 0-1 for canvas.toBlob
  const quality = qualityPercent / 100

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.')
  }

  // Resize and compress image before upload
  const processedFile = await processImageFile(file, maxDimension, quality)

  // Generate unique public_id to prevent overwriting
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const uniqueId = `lunchwheel-${timestamp}-${randomId}`

  // Create form data for upload
  const formData = new FormData()
  formData.append('file', processedFile)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'lunchwheel') // Optional: organize images in a folder
  formData.append('public_id', uniqueId) // Unique ID to prevent overwriting

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || `Upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.secure_url // Return the secure HTTPS URL
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw error
  }
}

/**
 * Process image file: resize and compress
 * @param {File} file - Original image file
 * @param {number} maxDimension - Maximum width or height
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<Blob>} Processed image as Blob
 */
async function processImageFile(file, maxDimension, quality) {
  // If not an image, return original file
  if (!String(file.type || '').startsWith('image/')) {
    return file
  }

  // Read file as data URL
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  // Create image element
  const img = await new Promise((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = base64
  })

  const width = img.width
  const height = img.height
  const scale = Math.min(1, maxDimension / Math.max(width, height))

  // If small enough, return original file
  if (scale >= 1) {
    return file
  }

  // Resize image
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create blob'))
        }
      },
      'image/jpeg',
      quality
    )
  })
}

