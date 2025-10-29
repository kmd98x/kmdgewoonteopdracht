"use client";
import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Toast({ type = 'success', message, onClose }) {
  useEffect(() => {
    const id = setTimeout(() => onClose?.(), 2500)
    return () => clearTimeout(id)
  }, [onClose])

  const color = type === 'success' ? 'bg-green-500' : 'bg-slate-700'

  return (
    <motion.div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 text-white px-4 py-2 rounded-xl shadow-soft ${color}`}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 10, opacity: 0 }}
    >
      {message}
    </motion.div>
  )
}

