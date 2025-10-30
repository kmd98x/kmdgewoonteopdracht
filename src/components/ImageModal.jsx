"use client";
import React from 'react'
import { motion } from 'framer-motion'

export default function ImageModal({ src, onClose }) {
  if (!src) return null
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        className="relative max-w-[90vw] max-h-[85vh]"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
      >
        <img src={src} alt="Foto" className="rounded-2xl shadow-soft max-h-[85vh] object-contain" />
        <button onClick={onClose} className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-lg">Sluiten</button>
      </motion.div>
    </motion.div>
  )
}

