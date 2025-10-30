"use client";
import React, { useMemo, useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import LunchWheel from './components/Wheel.jsx'
import RecipeModal from './components/RecipeModal.jsx'
import ProgressCalendar from './components/ProgressCalendar.jsx'
import Toast from './components/Toast.jsx'
import { storage } from './utils/storage.js'

const DAILY_SAVINGS_EURO = 4
const SAVINGS_GOAL = 150
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
      trySpeak('Goed gedaan Martina, blijf zo doorgaan!')
    }
  }

  const handleSpinResult = (recipe) => {
    setSelectedRecipe(recipe)
  }

  function trySpeak(text) {
    try {
      if (!('speechSynthesis' in window)) return

      const chooseVoice = () => {
        const voices = window.speechSynthesis.getVoices?.() || []
        const byLang = voices.filter(v => v.lang?.toLowerCase().startsWith('nl'))
        // Prefer higher-quality voices if available
        const preferred = byLang.find(v => /google|premium|natural/i.test(v.name))
          || byLang.find(v => /female|vrouw/i.test(v.name))
          || byLang[0]
        return preferred || voices[0] || null
      }

      const speakNow = () => {
        const utter = new SpeechSynthesisUtterance(text)
        utter.lang = 'nl-NL'
        const voice = chooseVoice()
        if (voice) utter.voice = voice
        utter.rate = 1.08
        utter.pitch = 1.25
        utter.volume = 1
        window.speechSynthesis.speak(utter)

        // Background music (prefer /music.mp3, fallback to /cheer.mp3)
        try {
          const music = new Audio('/music.mp3')
          music.volume = 0.18
          music.play().catch(() => {
            const cheer = new Audio('/cheer.mp3')
            cheer.volume = 0.22
            cheer.play().catch(() => {})
            setTimeout(() => { try { cheer.pause() } catch {} }, 3500)
          })
          // Fade out after 3.5s if music started
          setTimeout(() => {
            try {
              const fade = setInterval(() => {
                if (!music || music.volume <= 0.02) { clearInterval(fade); try { music.pause() } catch {} ; return }
                music.volume = Math.max(0, music.volume - 0.02)
              }, 120)
            } catch {}
          }, 3500)
        } catch {}
      }

      // Voices can load async
      const voices = window.speechSynthesis.getVoices?.() || []
      if (voices.length === 0) {
        const handler = () => {
          speakNow()
          window.speechSynthesis.onvoiceschanged = null
        }
        window.speechSynthesis.onvoiceschanged = handler
        // Fallback timer in case event doesn't fire
        setTimeout(() => {
          if (window.speechSynthesis.onvoiceschanged === handler) {
            handler()
          }
        }, 400)
      } else {
        speakNow()
      }
    } catch {
      // ignore
    }
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
            <ProgressCalendar
              onDayToggle={handleDayToggle}
              onDataChange={(data) => {
                const checkedCount = Object.values(data || {}).filter((d) => d?.checked).length
                setTotalSaved(checkedCount * DAILY_SAVINGS_EURO)
              }}
            />
          </div>
        </section>

        <footer className="mt-8 card text-center">
          <div className="space-y-3">
            <p className="text-lg text-slate-800">
              Tot nu toe heb je <span className="font-bold">€{totalSaved}</span> bespaard in deze 28 dagen!
            </p>
            <div className="text-sm text-slate-600">
              Doel: €{SAVINGS_GOAL} · Nog <span className="font-semibold">€{Math.max(0, SAVINGS_GOAL - totalSaved)}</span> te gaan
            </div>
            <div className="w-full h-3 bg-pastel-blue rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500"
                style={{ width: `${Math.min(100, Math.round((totalSaved / SAVINGS_GOAL) * 100))}%` }}
                aria-valuemin={0}
                aria-valuemax={SAVINGS_GOAL}
                aria-valuenow={totalSaved}
                role="progressbar"
              />
            </div>
          </div>
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

