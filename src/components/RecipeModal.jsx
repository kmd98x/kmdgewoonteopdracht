"use client";
import React from 'react'
import { motion } from 'framer-motion'

export default function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <motion.div
        className="relative card w-[90%] max-w-lg"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-slate-800">{recipe.name}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <ol className="list-decimal pl-6 space-y-2 text-slate-700">
          {recipe.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </motion.div>
    </motion.div>
  )
}

