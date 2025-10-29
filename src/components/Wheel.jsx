"use client";
import React, { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const RECIPES = [
  {
    name: 'Broodje gezond',
    steps: [
      'Pak 2 sneetjes volkoren brood',
      'Kook 1 ei 15 min, snij in plakjes',
      'Snij dunne plakjes komkommer en tomaat',
      'Beleg je broodje met dit alles'
    ],
    color: '#FDE2E4'
  },
  {
    name: 'Rijst met gehaktvlees',
    steps: [
      'Kook rijst 12 min',
      'Bak gehakt met ui, knoflook, peper, lente-ui en sojasaus',
      'Bak een eitje',
      'Serveer rijst met gehakt en ei'
    ],
    color: '#CDEAC0'
  },
  {
    name: 'Brood met sardine',
    steps: [
      'Pak 2 sneetjes brood',
      'Snij wat ui en peper',
      'Open blik sardine, verwijder graten',
      'Beleg je brood met sardine'
    ],
    color: '#D7E3FC'
  },
  {
    name: 'Zelfgemaakte nachos',
    steps: [
      'Bak gehakt met taco-kruiden',
      'Smash een avocado',
      'Vul schaal met maïschips',
      'Leg vlees en plakje kaas op chips',
      'Oven 6 minuten'
    ],
    color: '#FFF5BA'
  },
  {
    name: 'Gekookt ei',
    steps: [
      'Kook een ei 15 minuten'
    ],
    color: '#EADCF8'
  },
  {
    name: 'Cruesli',
    steps: [
      'Pak een kom en zet wat cruesli in de kom',
      'Zet melk erin',
      'Zet het in de microwave voor 1 minuut'
    ],
    color: '#F8EDEB'
  },
  {
    name: 'Noedels',
    steps: [
      'Kook water',
      'Noedels in het water tot zacht',
      'Voeg saus toe en mix'
    ],
    color: '#E2ECE9'
  },
]

export default function LunchWheel({ onSelect }) {
  const [spinning, setSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const wheelRef = useRef(null)

  const sliceAngle = useMemo(() => 360 / RECIPES.length, [])

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    const extraSpins = 6 * 360
    const randomOffset = Math.floor(Math.random() * 360)
    const newRotation = rotation + extraSpins + randomOffset
    setRotation(newRotation)

    // Determine selected slice after animation (timed close to transition duration)
    setTimeout(() => {
      const normalized = ((newRotation % 360) + 360) % 360
      // Assuming pointer at top (0deg), reverse index from 360
      const index = Math.floor(((360 - normalized) % 360) / sliceAngle) % RECIPES.length
      const recipe = RECIPES[index]
      onSelect?.(recipe)
      setSpinning(false)
    }, 1200)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Pointer */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-pink-500" />
        </div>

        <motion.div
          ref={wheelRef}
          className="w-64 h-64 md:w-80 md:h-80 rounded-full shadow-soft cursor-pointer select-none"
          style={{ background: 'conic-gradient(#FDE2E4 0 51.4deg, #CDEAC0 51.4deg 102.8deg, #D7E3FC 102.8deg 154.2deg, #FFF5BA 154.2deg 205.6deg, #EADCF8 205.6deg 257deg, #F8EDEB 257deg 308.4deg, #E2ECE9 308.4deg 360deg)' }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
          onClick={spin}
        >
          {/* Labels */}
          <div className="relative w-full h-full rounded-full overflow-hidden">
            {RECIPES.map((r, i) => (
              <div
                key={r.name}
                className="absolute top-1/2 left-1/2 text-xs md:text-sm font-semibold text-slate-800"
                style={{
                  transform: `rotate(${i * sliceAngle}deg) translate(0, -44%)`,
                  transformOrigin: '0 0'
                }}
              >
                <span className="bg-white/80 rounded-lg px-3 py-1.5 shadow-soft tracking-wide whitespace-nowrap backdrop-blur-sm">
                  {r.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      <button
        onClick={spin}
        disabled={spinning}
        className="px-4 py-2 rounded-xl bg-pink-500 text-white font-semibold shadow-soft disabled:opacity-60"
      >{spinning ? 'Draaien…' : 'Draai het wiel'}</button>
    </div>
  )
}

export { RECIPES }

