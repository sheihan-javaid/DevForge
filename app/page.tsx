"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import ToolCard from "@/components/ToolCard"
import { tools, searchTools, categories, getToolsByCategory } from "@/data/tools"
import type { Category } from "@/data/tools"

export default function Home() {
  const [query, setQuery] = useState("")

  // ── Search / filter ────────────────────────────────────────────────────────

  const isSearching   = query.trim().length > 0
  const searchResults = useMemo(() => searchTools(query), [query])

  // ── Grouped by category (default view) ────────────────────────────────────

  const grouped = useMemo(() =>
    categories.map((cat) => ({
      category: cat,
      tools:    getToolsByCategory(cat as Category),
    })).filter(({ tools }) => tools.length > 0),
  [])

  return (
    <div className="space-y-16">

      {/* Hero */}
      <section className="text-center py-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
          ⚡ 100% free, no sign-up required
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dev tools that just{" "}
          <span className="text-violet-600 dark:text-violet-400">work</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
          A clean, fast toolkit for developers. Format, encode, generate, and convert — right in your browser.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="#tools"
            className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
          >
            Browse tools
          </Link>
          <Link
            href="https://github.com/yourusername/devforge"
            target="_blank"
            className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors text-gray-700 dark:text-gray-300"
          >
            GitHub →
          </Link>
        </div>
      </section>

      {/* Search */}
      <section id="tools" className="space-y-3">
        <div className="relative">
          {/* Search icon */}
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools — try 'encode', 'hash', 'uuid'..."
            className="
              w-full pl-10 pr-10 py-3 rounded-xl
              border border-gray-200 dark:border-gray-700
              bg-white dark:bg-gray-900
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-600
              text-sm focus:outline-none focus:ring-2
              focus:ring-violet-400/20 focus:border-violet-400
              dark:focus:border-violet-600 transition-colors
            "
          />

          {/* Clear button */}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6"  x2="6"  y2="18"/>
                <line x1="6"  y1="6"  x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Result count */}
        {isSearching && (
          <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
            {searchResults.length === 0
              ? `No tools found for "${query}"`
              : `${searchResults.length} tool${searchResults.length > 1 ? "s" : ""} found for "${query}"`
            }
          </p>
        )}
      </section>

      {/* Search results */}
      {isSearching && (
        <section>
          {searchResults.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="text-4xl">🔍</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No tools match "{query}"
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Try searching for "json", "base64", "uuid", or "hash"
              </p>
              <button
                onClick={() => setQuery("")}
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((tool) => (
                <ToolCard
                  key={tool.slug}
                  title={tool.name}
                  description={tool.description}
                  icon={tool.icon}
                  link={`/tools/${tool.slug}`}
                  isNew={tool.isNew}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Default grouped view */}
      {!isSearching && (
        <div className="space-y-16">
          {grouped.map(({ category, tools: categoryTools }) => (
            <section key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {categoryTools.length} tool{categoryTools.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTools.map((tool) => (
                  <ToolCard
                    key={tool.slug}
                    title={tool.name}
                    description={tool.description}
                    icon={tool.icon}
                    link={`/tools/${tool.slug}`}
                    isNew={tool.isNew}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Stats bar */}
      <section className="border-t border-gray-200 dark:border-gray-800 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { label: "Free tools",      value: tools.length      },
            { label: "Categories",      value: categories.length },
            { label: "No sign-up",      value: "Ever"            },
            { label: "Runs in browser", value: "100%"            },
          ].map(({ label, value }) => (
            <div key={label} className="space-y-1">
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                {value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}