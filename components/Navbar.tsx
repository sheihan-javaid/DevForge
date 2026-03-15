"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"

const navLinks = [
  { label: "Home",   href: "/",                                        external: false },
  { label: "GitHub", href: "https://github.com/sheihan-javaid/DevForge", external: true  },
]

export default function Navbar() {
  const pathname   = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-violet-600 text-white text-xs font-bold">
              D
            </span>
            DevForge
          </Link>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ label, href, external }) => {
              const isActive = !external && pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  className={`
                    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }
                  `}
                >
                  {label}
                  {external && <span className="ml-1 opacity-50">↗</span>}
                </Link>
              )
            })}
            <div className="ml-1">
              <ThemeToggle />
            </div>
          </nav>

          {/* Mobile: theme toggle + hamburger */}
          <div className="sm:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              <div className="flex flex-col gap-1">
                <span className={`block h-0.5 w-4 bg-current transition-transform origin-center ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
                <span className={`block h-0.5 w-4 bg-current transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
                <span className={`block h-0.5 w-4 bg-current transition-transform origin-center ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
              </div>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 space-y-1">
          {navLinks.map(({ label, href, external }) => (
            <Link
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {label} {external && "↗"}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between px-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  )
}