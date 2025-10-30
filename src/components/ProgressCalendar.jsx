"use client";
import React, { useEffect, useMemo, useState } from 'react'
import { storage } from '../utils/storage.js'
import { AnimatePresence } from 'framer-motion'
import ImageModal from './ImageModal.jsx'
import { uploadUnsigned, isCloudinaryConfigured } from '../utils/cloudinary.js'

const STORAGE_KEY = 'lunchwheel-progress-v1'

// Generate the 28-day window from Nov 1, 2025
function generateDays() {
  const start = new Date('2025-11-01T00:00:00')
  return Array.from({ length: 28 }).map((_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = d.toISOString().slice(0, 10) // YYYY-MM-DD
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

  const onUpload = async (key, files) => {
    const list = Array.from(files || [])
    if (list.length === 0) return
    const first = list[0]
    const dataUrl = await readFileAsDataURL(first)
    setData(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), checked: true, photoDataUrl: dataUrl }
    }))
    onDayToggle?.(true)

    // Background upload to Cloudinary (up to 50 items)
    if (isCloudinaryConfigured()) {
      void uploadManyToCloudinary(list.slice(0, 50), 'lunchwheel/library')
    }
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
                    multiple
                    className="hidden"
                    onChange={(e) => onUpload(key, e.target.files)}
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

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function uploadManyToCloudinary(files, folder) {
  const queue = [...files]
  const CONCURRENCY = 5

  async function uploadWithRetry(file, attempts = 2) {
    let lastErr
    for (let i = 0; i < attempts; i++) {
      try {
        await uploadUnsigned({ file, folder })
        return
      } catch (e) {
        lastErr = e
      }
    }
    // Optionally log the last error; keep UI silent
    console.warn('Upload failed after retries:', lastErr)
  }

  async function worker() {
    while (queue.length) {
      const file = queue.shift()
      if (!file) break
      await uploadWithRetry(file)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
}

