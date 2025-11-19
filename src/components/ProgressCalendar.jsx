"use client";
import React, { useEffect, useMemo, useState } from 'react'
import { storage } from '../utils/storage.js'
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

export default function ProgressCalendar({ onDayToggle, onDataChange }) {
  const days = useMemo(() => generateDays(), [])
  const [data, setData] = useState(() => storage.get(STORAGE_KEY, {}))
  const [zoomSrc, setZoomSrc] = useState(null)

  useEffect(() => {
    storage.set(STORAGE_KEY, data)
    onDataChange?.(data)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const toggleDay = (key) => {
    let didCheck = false
    setData(prev => {
      const prevDay = prev[key] || { checked: false, photoDataUrl: null }
      const nextChecked = !prevDay.checked
      didCheck = nextChecked
      const nextDay = { ...prevDay, checked: nextChecked }
      const next = { ...prev, [key]: nextDay }
      return next
    })
    onDayToggle?.(didCheck)
  }

  const onUpload = async (key, file) => {
    if (!file) return
    const dataUrl = await resizeImageFile(file, 1024, 0.85)
    setData(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), checked: true, photoDataUrl: dataUrl }
    }))
    onDayToggle?.(true)
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {days.map(({ key, date }) => {
          const entry = data[key] || { checked: false, photoDataUrl: null, feelingsNote: '', contextNote: '' }
          const dayNum = date.getDate()
          const label = date.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: 'short' })
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
                <label className="text-sm bg-pink-100 text-pink-700 px-2 py-1 rounded-lg cursor-pointer hover:bg-pink-200">
                  Foto uploaden
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => onUpload(key, e.target.files?.[0])}
                  />
                </label>
                {entry.photoDataUrl && (
                  <button onClick={() => setZoomSrc(entry.photoDataUrl)} className="focus:outline-none">
                    <img src={entry.photoDataUrl} alt="bewijs"
                         className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                  </button>
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

async function resizeImageFile(file, maxDimension = 1024, quality = 0.85) {
  // Read file as data URL first
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  // If not an image, return original base64
  if (!String(file.type || '').startsWith('image/')) return base64

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

  // If small enough, keep original
  if (scale >= 1) return base64

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  // Prefer JPEG for better compression; fallback to PNG
  try {
    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return canvas.toDataURL('image/png')
  }
}

