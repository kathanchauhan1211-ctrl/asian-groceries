'use client'

import { motion, AnimatePresence } from 'motion/react'
import { ReactNode } from 'react'

type SwitchProps = {
  value: boolean
  onToggle: () => void
  iconOn: ReactNode
  iconOff: ReactNode
  className?: string
}

export function Switch({ value, onToggle, iconOn, iconOff, className = '' }: SwitchProps) {
  return (
    <button
      className={`flex w-12 cursor-pointer rounded-full p-0.5 transition-colors duration-300 ${
        value ? 'justify-end' : 'justify-start'
      } ${className}`}
      style={{ background: value ? 'rgba(249,115,22,0.25)' : 'rgba(100,116,139,0.2)' }}
      onClick={onToggle}
      aria-label={value ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        className="flex items-center justify-center size-6 rounded-full"
        style={{ background: 'var(--background)' }}
        layout
        transition={{ type: 'spring', duration: 0.6, bounce: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {value ? (
            <motion.div
              key="on"
              initial={{ opacity: 0, rotate: -60 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 60 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center size-5"
            >
              {iconOn}
            </motion.div>
          ) : (
            <motion.div
              key="off"
              initial={{ opacity: 0, rotate: 60 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -60 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center size-5"
            >
              {iconOff}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </button>
  )
}
