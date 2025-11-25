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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {days.map(({ key, date }) => {
          const entry = data[key] || { checked: false, photoUrl: null, photoDataUrl: null, feelingsNote: '', contextNote: '', time: '', feelingEmoji: '' }
          const dayNum = date.getDate()
          const label = date.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: 'short' })
          // Support both Cloudinary URLs and legacy base64 data URLs
          const photoUrl = entry.photoUrl || entry.photoDataUrl
          const isUploading = uploading[key]
          
          const handleEmojiClick = (emoji) => {
            setData(prev => ({
              ...prev,
              [key]: {
                ...(prev[key] || {}),
                feelingEmoji: prev[key]?.feelingEmoji === emoji ? '' : emoji
              }
            }))
          }
          
          return (
            <div key={key} className="rounded-2xl p-5 md:p-6 border border-slate-200/80 bg-white shadow-sm hover:shadow-lg transition-all duration-300 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <div className="text-xs md:text-sm text-slate-400 mb-1.5 font-medium tracking-wide uppercase">{label}</div>
                  <div className="text-2xl md:text-3xl font-bold text-slate-900">Dag {dayNum}</div>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-5 h-5 md:w-6 md:h-6 accent-blue-600 cursor-pointer"
                    checked={entry.checked}
                    onChange={() => toggleDay(key)}
                  />
                </label>
              </div>
              <div className="mt-5 mb-5 flex items-start gap-4">
                <label className={`text-sm font-medium bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 px-4 py-2.5 rounded-xl cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm hover:shadow-md border border-blue-200/50 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                  <button onClick={() => setZoomSrc(photoUrl)} className="focus:outline-none group">
                    <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      <img 
                        src={photoUrl} 
                        alt="bewijs"
                        key={`${key}-${entry.photoUrl || entry.photoDataUrl}`}
                        className="w-16 h-16 md:w-20 md:h-20 object-cover" 
                        onError={(e) => {
                          console.error('Image load error for', key, photoUrl)
                          e.target.style.display = 'none'
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully for', key, photoUrl)
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </button>
                )}
                {isUploading && (
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center shadow-sm">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="mt-5 space-y-4">
                {/* Time input */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2.5 tracking-wide">Tijd</label>
                  <input
                    type="time"
                    value={entry.time || ''}
                    onChange={(e) => setData(prev => ({ ...prev, [key]: { ...(prev[key] || {}), time: e.target.value } }))}
                    className="w-full text-sm md:text-base p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-white transition-all shadow-sm hover:shadow-md"
                  />
                </div>
                
                {/* Feelings section with emoji option */}
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2.5 tracking-wide">
                    Hoe voelde je je?
                    <span className="text-xs text-slate-500 block mt-2 font-normal leading-relaxed">
                      Als je het liever niet wilt typen, kun je ook een emoji kiezen die het gevoel op dat moment beschreef.
                    </span>
                  </label>
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => handleEmojiClick('😠')}
                      className={`text-2xl md:text-3xl p-3 md:p-3.5 rounded-xl border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                        entry.feelingEmoji === '😠' 
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md ring-2 ring-blue-200' 
                          : 'border-slate-200 hover:border-blue-300 bg-white shadow-sm'
                      }`}
                      title="Boos"
                    >
                      😠
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEmojiClick('😐')}
                      className={`text-2xl md:text-3xl p-3 md:p-3.5 rounded-xl border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                        entry.feelingEmoji === '😐' 
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md ring-2 ring-blue-200' 
                          : 'border-slate-200 hover:border-blue-300 bg-white shadow-sm'
                      }`}
                      title="Neutraal"
                    >
                      😐
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEmojiClick('😊')}
                      className={`text-2xl md:text-3xl p-3 md:p-3.5 rounded-xl border-2 transition-all duration-200 hover:scale-110 hover:shadow-md ${
                        entry.feelingEmoji === '😊' 
                          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md ring-2 ring-blue-200' 
                          : 'border-slate-200 hover:border-blue-300 bg-white shadow-sm'
                      }`}
                      title="Blij"
                    >
                      😊
                    </button>
                    {entry.feelingEmoji && (
                      <span className="text-2xl md:text-3xl ml-2 drop-shadow-sm">{entry.feelingEmoji}</span>
                    )}
                  </div>
                  <textarea
                    value={entry.feelingsNote || ''}
                    onChange={(e) => setData(prev => ({ ...prev, [key]: { ...(prev[key] || {}), feelingsNote: e.target.value } }))}
                    placeholder="Of typ hier hoe je je voelde..."
                    className="w-full text-sm md:text-base p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-white transition-all shadow-sm hover:shadow-md resize-none"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-xs md:text-sm font-semibold text-slate-700 mb-2.5 tracking-wide">Omstandigheden / waarom (wel/niet)?</label>
                  <textarea
                    value={entry.contextNote || ''}
                    onChange={(e) => setData(prev => ({ ...prev, [key]: { ...(prev[key] || {}), contextNote: e.target.value } }))}
                    placeholder="Beschrijf de omstandigheden..."
                    className="w-full text-sm md:text-base p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 focus:bg-white transition-all shadow-sm hover:shadow-md resize-none"
                    rows={3}
                  />
                </div>
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


