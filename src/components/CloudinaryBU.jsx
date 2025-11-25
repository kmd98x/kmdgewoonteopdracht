"use client";
import React, { useState } from 'react'
import { uploadToCloudinary } from '../utils/cloudinary.js'
import { storage } from '../utils/storage.js'
import Toast from './Toast.jsx'
import { AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'lunchwheel-bulk-upload-v1'

export default function CloudinaryBU({ onError }) {
  const [uploading, setUploading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState(() => storage.get(STORAGE_KEY, []))
  const [toast, setToast] = useState(null)

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file, {
        maxDimension: 800,
        quality: 70
      }).catch(error => {
        console.error('Upload error:', error)
        return null
      })
    )

    try {
      const results = await Promise.all(uploadPromises)
      const successfulUploads = results.filter(url => url !== null)
      
      if (successfulUploads.length > 0) {
        const newImages = [...uploadedImages, ...successfulUploads]
        setUploadedImages(newImages)
        storage.set(STORAGE_KEY, newImages)
        // Success notification removed - uploads continue silently in background
      }

      if (successfulUploads.length < files.length) {
        const failed = files.length - successfulUploads.length
        onError?.(`${failed} foto${failed > 1 ? "'s" : ''} konden niet worden geüpload.`)
      }
    } catch (error) {
      console.error('Bulk upload error:', error)
      onError?.(error.message || 'Fout bij bulk upload.')
    } finally {
      setUploading(false)
      // Reset file input
      e.target.value = ''
    }
  }


  return (
    <div>
      <div className="card mb-6">
        <label className={`block w-full text-center py-8 px-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
          uploading 
            ? 'border-blue-300 bg-blue-50/50 cursor-not-allowed' 
            : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50/30'
        }`}>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading}
            onChange={handleFileSelect}
          />
          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-700 font-medium">Uploaden...</span>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-center">
                  <span className="text-blue-600 font-semibold">Klik om foto's te selecteren</span>
                  <p className="text-sm text-slate-500 mt-1">of sleep foto's hierheen</p>
                  <p className="text-xs text-slate-400 mt-1">Meerdere foto's tegelijk mogelijk</p>
                </div>
              </>
            )}
          </div>
        </label>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast {...toast} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}

