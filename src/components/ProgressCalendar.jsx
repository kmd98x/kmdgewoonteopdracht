"use client";
import React, { useEffect, useMemo, useState } from 'react'
import { storage } from '../utils/storage.js'
import { uploadToCloudinary } from '../utils/cloudinary.js'
import { AnimatePresence } from 'framer-motion'
import ImageModal from './ImageModal.jsx'

const STORAGE_KEY = 'lunchwheel-progress-v1'

// Generate the 28-day window from Nov 1, 2025
function generateDays() {
  const startYear = 2025
  const startMonth = 10 // November (0-indexed)
  const startDay = 1
  return Array.from({ length: 28 }).map((_, i) => {
    const d = new Date(startYear, startMonth, startDay + i)
    // Format as YYYY-MM-DD in local timezone
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const key = `${year}-${month}-${day}`
    return { key, date: d }
  })
}

export default function ProgressCalendar({ onDayToggle, onDataChange, onError }) {
  const days = useMemo(() => generateDays(), [])
  const [data, setData] = useState(() => storage.get(STORAGE_KEY, {}))
  const [zoomSrc, setZoomSrc] = useState(null)
  const [uploading, setUploading] = useState({}) // Track uploads by key

  useEffect(() => {
    const result = storage.set(STORAGE_KEY, data)
    if (!result.success) {
      console.error('Storage error:', result.error, result.message)
      onError?.(result.message || 'Fout bij opslaan van gegevens.')
    }
    // Always call onDataChange to keep UI in sync
    onDataChange?.(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const toggleDay = (key) => {
    let didCheck = false
    setData(prev => {
      const prevDay = prev[key] || { checked: false, photoUrl: null, photoDataUrl: null }
      const nextChecked = !prevDay.checked
      didCheck = nextChecked
      const nextDay = { ...prevDay, checked: nextChecked }
      const next = { ...prev, [key]: nextDay }
      return next
    })
    onDayToggle?.(didCheck)
  }

  const onUpload = async (key, file, inputElement) => {
    if (!file) return
    
    // Prevent multiple simultaneous uploads for the same day
    if (uploading[key]) {
      console.warn('Upload already in progress for', key)
      return
    }
    
    setUploading(prev => ({ ...prev, [key]: true }))
    
    try {
      console.log('Starting upload for', key, 'File:', file.name, 'Size:', file.size)
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(file, {
        maxDimension: 800,
        quality: 70
      })
      
      console.log('Upload successful for', key, 'URL:', cloudinaryUrl)
      
      // Update data with Cloudinary URL using functional update to avoid race conditions
      setData(prev => {
        const currentEntry = prev[key] || {}
        // Only update if this is still the current state (prevent stale updates)
        return {
          ...prev,
          [key]: { 
            ...currentEntry, 
            checked: true, 
            photoUrl: cloudinaryUrl,
            // Clear old photoDataUrl to avoid conflicts
            photoDataUrl: null
          }
        }
      })
      
      onDayToggle?.(true)
      
      // Reset the file input to allow uploading the same file again
      if (inputElement) {
        inputElement.value = ''
      }
    } catch (error) {
      console.error('Upload error for', key, ':', error)
      onError?.(error.message || 'Fout bij uploaden van foto. Probeer het opnieuw.')
      
      // Reset input even on error
      if (inputElement) {
        inputElement.value = ''
      }
    } finally {
      setUploading(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {days.map(({ key, date }) => {
          const entry = data[key] || { checked: false, photoUrl: null, photoDataUrl: null, feelingsNote: '', contextNote: '' }
          const dayNum = date.getDate()
          const label = date.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: 'short' })
          // Support both Cloudinary URLs and legacy base64 data URLs
          const photoUrl = entry.photoUrl || entry.photoDataUrl
          const isUploading = uploading[key]
          
          return (
            <div key={key} className="rounded-xl p-3 border border-slate-200 bg-white/70">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="text-lg font-semibold text-slate-800">Dag {dayNum}</div>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-pink-500"
                    checked={entry.checked}
                    onChange={() => toggleDay(key)}
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className={`text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-lg cursor-pointer hover:bg-pink-200 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isUploading ? 'Uploaden...' : 'Foto uploaden'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        onUpload(key, file, e.target)
                      }
                    }}
                  />
                </label>
                {photoUrl && !isUploading && (
                  <button onClick={() => setZoomSrc(photoUrl)} className="focus:outline-none">
                    <img 
                      src={photoUrl} 
                      alt="bewijs"
                      key={`${key}-${entry.photoUrl || entry.photoDataUrl}`} // Force re-render when URL changes
                      className="w-10 h-10 rounded-lg object-cover border border-slate-200" 
                      onError={(e) => {
                        console.error('Image load error for', key, photoUrl)
                        e.target.style.display = 'none'
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully for', key, photoUrl)
                      }}
                    />
                  </button>
                )}
                {isUploading && (
                  <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-2">
                <textarea
                  value={entry.feelingsNote || ''}
                  onChange={(e) => setData(prev => ({ ...prev, [key]: { ...(prev[key] || {}), feelingsNote: e.target.value } }))}
                  placeholder="Hoe voelde je je?"
                  className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  rows={2}
                />
                <textarea
                  value={entry.contextNote || ''}
                  onChange={(e) => setData(prev => ({ ...prev, [key]: { ...(prev[key] || {}), contextNote: e.target.value } }))}
                  placeholder="Omstandigheden / waarom (wel/niet)?"
                  className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  rows={2}
                />
              </div>
            </div>
          )
        })}
      </div>
      <AnimatePresence>{zoomSrc && (
        <ImageModal src={zoomSrc} onClose={() => setZoomSrc(null)} />
      )}</AnimatePresence>
    </div>
  )
}


