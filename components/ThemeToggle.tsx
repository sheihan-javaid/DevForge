"use client"

import { useState, useEffect } from "react"

export default function ThemeToggle() {
  const [dark,    setDark]    = useState(false)
  const [mounted, setMounted] = useState(false)

  // ── On mount: read stored preference or system preference ─────────────────

  useEffect(() => {
    setMounted(true)
    const stored      = localStorage.getItem("devforge:theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const isDark      = stored === "dark" || (!stored && prefersDark)
    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  // ── Also listen for OS theme changes ──────────────────────────────────────

  useEffect(() => {
    const media    = window.matchMedia("(prefers-color-scheme: dark)")
    const handler  = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem("devforge:theme")
      if (!stored) {
        setDark(e.matches)
        document.documentElement.classList.toggle("dark", e.matches)
      }
    }
    media.addEventListener("change", handler)
    return () => media.removeEventListener("change", handler)
  }, [])

  // ── Toggle ────────────────────────────────────────────────────────────────

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("devforge:theme", next ? "dark" : "light")
  }

  // ── Placeholder during SSR to prevent hydration mismatch ──────────────────

  if (!mounted) {
    return (
      <div className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" />
    )
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        w-8 h-8 flex items-center justify-center
        rounded-lg border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-900
        text-gray-500 dark:text-gray-400
        hover:bg-gray-50 dark:hover:bg-gray-800
        hover:border-gray-300 dark:hover:border-gray-600
        transition-colors duration-150
      "
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"  x2="12" y2="3"  />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}