"use client";
import React, { useMemo, useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import LunchWheel from './components/Wheel.jsx'
import RecipeModal from './components/RecipeModal.jsx'
import ProgressCalendar from './components/ProgressCalendar.jsx'
import Toast from './components/Toast.jsx'
import { storage } from './utils/storage.js'

const DAILY_SAVINGS_EURO = 4
const STORAGE_KEYS = {
  calendar: 'lunchwheel-progress-v1',
  savings: 'lunchwheel-savings-v1',
}

export default function App() {
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [toast, setToast] = useState(null)

  const totalSuccessfulDays = useMemo(() => {
    const calendar = storage.get(STORAGE_KEYS.calendar, {})
    const days = Object.values(calendar) || []
    return days.filter(d => d?.checked === true).length
  }, [])

  const [totalSaved, setTotalSaved] = useState(totalSuccessfulDays * DAILY_SAVINGS_EURO)

  useEffect(() => {
    storage.set(STORAGE_KEYS.savings, totalSaved)
  }, [totalSaved])

  const handleDayToggle = (didCheck) => {
    setTotalSaved(prev => {
      const next = Math.max(0, prev + (didCheck ? DAILY_SAVINGS_EURO : -DAILY_SAVINGS_EURO))
      return next
    })
    if (didCheck) {
      setToast({ type: 'success', message: `Yay! Vandaag heb je zelf gekookt en €${DAILY_SAVINGS_EURO} bespaard!` })
    }
  }

  const handleSpinResult = (recipe) => {
    setSelectedRecipe(recipe)
  }

  return (
    <div className="app-container">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800">Mijn Lunch Gewoonte</h1>
          <p className="mt-2 text-slate-600">Blijf volhouden — elke dag zelfgemaakt telt én bespaart!</p>
        </header>

        <section className="space-y-6 md:space-y-8">
          <div className="card">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">LunchWheel</h2>
            <LunchWheel onSelect={handleSpinResult} />
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">28-dagen voortgang</h2>
            <ProgressCalendar onDayToggle={handleDayToggle} />
          </div>
        </section>

        <footer className="mt-8 card text-center">
          <p className="text-lg text-slate-800">
            Tot nu toe heb je <span className="font-bold">€{totalSaved}</span> bespaard in deze 28 dagen!
          </p>
        </footer>

        <AnimatePresence>{toast && (
          <Toast {...toast} onClose={() => setToast(null)} />
        )}</AnimatePresence>

        <AnimatePresence>{selectedRecipe && (
          <RecipeModal recipe={selectedRecipe} onClose={() => setSelectedRecipe(null)} />
        )}</AnimatePresence>
      </div>
    </div>
  )
}

