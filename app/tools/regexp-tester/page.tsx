"use client"

import { useState, useCallback, useRef } from "react"
import {
  testRegex,
  PRESETS,
  FLAG_META,
} from "@/utils/regexTester"
import type {
  RegexResult,
  RegexFlags,
  RegexMatch,
  HighlightChunk,
} from "@/utils/regexTester"
import CopyButton from "@/components/CopyButton"

// ── Sub-components ────────────────────────────────────────────────────────────

function FlagToggle({
  flagKey,
  value,
  onChange,
}: {
  flagKey:  keyof RegexFlags
  value:    boolean
  onChange: (key: keyof RegexFlags, val: boolean) => void
}) {
  const meta = FLAG_META[flagKey]
  return (
    <button
      onClick={() => onChange(flagKey, !value)}
      title={meta.description}
      className={`
        px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors
        ${value
          ? "bg-violet-600 text-white"
          : "border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-700 dark:hover:text-violet-400"
        }
      `}
    >
      {meta.flag}
    </button>
  )
}

function HighlightedText({ chunks }: { chunks: HighlightChunk[] }) {
  const COLORS = [
    "bg-violet-200 dark:bg-violet-800/60 text-violet-900 dark:text-violet-100",
    "bg-amber-200 dark:bg-amber-800/60 text-amber-900 dark:text-amber-100",
    "bg-green-200 dark:bg-green-800/60 text-green-900 dark:text-green-100",
    "bg-pink-200 dark:bg-pink-800/60 text-pink-900 dark:text-pink-100",
    "bg-blue-200 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100",
  ]

  return (
    <div className="textarea-mono text-sm leading-relaxed whitespace-pre-wrap break-all p-4">
      {chunks.map((chunk, i) =>
        chunk.matched ? (
          <mark
            key={i}
            className={`
              rounded px-0.5
              ${COLORS[(chunk.matchIndex ?? 0) % COLORS.length]}
            `}
          >
            {chunk.text}
          </mark>
        ) : (
          <span key={i} className="text-gray-700 dark:text-gray-300">
            {chunk.text}
          </span>
        )
      )}
    </div>
  )
}

function MatchCard({
  match,
  index,
}: {
  match: RegexMatch
  index: number
}) {
  const hasGroups = Object.keys(match.namedGroups).length > 0 ||
    Object.values(match.groups).some((v) => v !== undefined)

  return (
    <div className="card rounded-xl overflow-hidden text-xs">
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Match {index + 1}
        </span>
        <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
          <span>line {match.line}, col {match.col}</span>
          <span>index {match.index}</span>
          <span>{match.length} chars</span>
        </div>
      </div>
      <div className="px-3 py-2.5 space-y-2">
        <div className="font-mono text-violet-700 dark:text-violet-400 break-all">
          {match.value || <span className="text-gray-400 italic">empty match</span>}
        </div>
        {hasGroups && (
          <div className="space-y-1 pt-1 border-t border-gray-100 dark:border-gray-800">
            {Object.entries(match.groups).map(([key, val]) =>
              val !== undefined ? (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-gray-400 dark:text-gray-500 w-16 shrink-0">
                    Group {key}
                  </span>
                  <span className="font-mono text-amber-600 dark:text-amber-400">
                    {val}
                  </span>
                </div>
              ) : null
            )}
            {Object.entries(match.namedGroups).map(([name, val]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500 w-16 shrink-0">
                  {name}
                </span>
                <span className="font-mono text-amber-600 dark:text-amber-400">
                  {val}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RegexTesterPage() {
  const [pattern,  setPattern]  = useState("")
  const [text,     setText]     = useState("")
  const [flags,    setFlags]    = useState<Partial<RegexFlags>>({ global: true })
  const [result,   setResult]   = useState<RegexResult | null>(null)
  const [tab,      setTab]      = useState<"matches" | "groups">("matches")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Run ────────────────────────────────────────────────────────────────────

  const run = useCallback((p: string, t: string, f: Partial<RegexFlags>) => {
    if (!p) { setResult(null); return }

    // Debounce slightly so rapid typing doesn't lag
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setResult(testRegex(p, t, f))
    }, 120)
  }, [])

  const handlePattern = (val: string) => {
    setPattern(val)
    run(val, text, flags)
  }

  const handleText = (val: string) => {
    setText(val)
    run(pattern, val, flags)
  }

  const handleFlag = (key: keyof RegexFlags, val: boolean) => {
    const next = { ...flags, [key]: val }
    setFlags(next)
    run(pattern, text, next)
  }

  const loadPreset = (index: number) => {
    const preset = PRESETS[index]
    setPattern(preset.pattern)
    setText(preset.testValue)
    const next = preset.flags
    setFlags(next)
    run(preset.pattern, preset.testValue, next)
  }

  const handleClear = () => {
    setPattern(""); setText(""); setResult(null)
    setFlags({ global: true })
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const data      = result?.ok ? result.data     : null
  const error     = result && !result.ok ? result.error : undefined
  const hint      = result && !result.ok ? result.hint  : undefined
  const matches   = data?.matches   ?? []
  const groups    = data?.groups    ?? []
  const stats     = data?.stats
  const hasGroups = groups.some((g) => g.values.length > 0)

  const flagString = [
    flags.global     ? "g" : "",
    flags.ignoreCase ? "i" : "",
    flags.multiline  ? "m" : "",
    flags.dotAll     ? "s" : "",
    flags.unicode    ? "u" : "",
    flags.sticky     ? "y" : "",
  ].join("")

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-xs">
            .*
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Regex Tester
          </h1>
          {data && (
            <span className={`badge ${matches.length > 0 ? "badge-green" : "badge-red"}`}>
              {matches.length > 0 ? `${matches.length} match${matches.length > 1 ? "es" : ""}` : "No matches"}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Test and debug regular expressions with live match highlighting.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <span className="section-label">Presets</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, i) => (
            <button
              key={preset.label}
              onClick={() => loadPreset(i)}
              title={preset.description}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pattern input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="section-label">Pattern</span>
          {pattern && !error && (
            <CopyButton text={`/${pattern}/${flagString}`} size="sm" />
          )}
        </div>
        <div className={`
          flex items-center gap-0
          border rounded-xl overflow-hidden
          bg-white dark:bg-gray-900
          transition-colors
          ${error
            ? "border-red-300 dark:border-red-700"
            : "border-gray-200 dark:border-gray-700 focus-within:border-violet-400 dark:focus-within:border-violet-600"
          }
        `}>
          {/* Leading slash */}
          <span className="pl-4 pr-1 text-gray-300 dark:text-gray-600 font-mono text-sm select-none">
            /
          </span>

          {/* Pattern field */}
          <input
            type="text"
            value={pattern}
            onChange={(e) => handlePattern(e.target.value)}
            placeholder="Enter your regex pattern..."
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            className="flex-1 py-3 bg-transparent font-mono text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none"
          />

          {/* Trailing slash + flags */}
          <span className="px-1 text-gray-300 dark:text-gray-600 font-mono text-sm select-none">
            /
          </span>
          <span className="pr-4 font-mono text-sm text-violet-600 dark:text-violet-400 min-w-[1rem]">
            {flagString}
          </span>
        </div>

        {/* Flag toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">Flags:</span>
          {(Object.keys(FLAG_META) as (keyof RegexFlags)[]).map((key) => (
            <FlagToggle
              key={key}
              flagKey={key}
              value={flags[key] ?? false}
              onChange={handleFlag}
            />
          ))}
          <button
            onClick={handleClear}
            className="ml-auto toolbar-btn-danger"
          >
            Clear
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-0.5">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
            {hint && <p className="text-xs text-red-400 dark:text-red-500">{hint}</p>}
          </div>
        )}
      </div>

      {/* Test input */}
      <div className="space-y-1.5">
        <span className="section-label">Test string</span>
        <textarea
          value={text}
          onChange={(e) => handleText(e.target.value)}
          placeholder="Enter the text to test against..."
          rows={6}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          className="
            w-full textarea-mono resize-y rounded-xl px-4 py-3
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            border border-gray-200 dark:border-gray-700
            focus:outline-none focus:ring-2 focus:ring-offset-0
            focus:border-violet-400 dark:focus:border-violet-600
            focus:ring-violet-400/20
            transition-colors
          "
        />
      </div>

      {/* Highlighted output */}
      {data && text && (
        <div className="space-y-2 animate-in">
          <span className="section-label">Highlighted matches</span>
          <div className="card rounded-xl overflow-hidden">
            <HighlightedText chunks={data.highlighted} />
          </div>
        </div>
      )}

      {/* Stats bar */}
      {stats && (
        <div className="stats-bar">
          {[
            { label: "Matches",   value: stats.matchCount               },
            { label: "Unique",    value: stats.uniqueMatches            },
            { label: "Coverage",  value: `${stats.coveragePercent}%`   },
            { label: "Chars in",  value: stats.totalChars.toLocaleString() },
            { label: "Chars matched", value: stats.coveredChars.toLocaleString() },
          ].map(({ label, value }) => (
            <span key={label}>
              <span className="stats-label">{label}: </span>
              {value}
            </span>
          ))}
        </div>
      )}

      {/* Matches + Groups tabs */}
      {data && matches.length > 0 && (
        <div className="space-y-3 animate-in">

          {/* Tab bar */}
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800">
            {(["matches", "groups"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`
                  px-4 py-2 text-sm font-medium capitalize transition-colors
                  border-b-2 -mb-px
                  ${tab === t
                    ? "border-violet-600 text-violet-700 dark:text-violet-400"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }
                `}
              >
                {t}
                {t === "matches" && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {matches.length}
                  </span>
                )}
                {t === "groups" && hasGroups && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {groups.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Matches tab */}
          {tab === "matches" && (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {matches.map((match, i) => (
                <MatchCard key={i} match={match} index={i} />
              ))}
            </div>
          )}

          {/* Groups tab */}
          {tab === "groups" && (
            <div className="space-y-3">
              {!hasGroups ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                  No capturing groups found. Add groups using <code className="text-xs">(...)</code> or named groups <code className="text-xs">(?&lt;name&gt;...)</code>
                </p>
              ) : (
                groups.map((group) => (
                  <div key={group.index} className="card rounded-xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                      <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                        Group {group.index}
                      </span>
                      {group.name && (
                        <span className="badge badge-violet">{group.name}</span>
                      )}
                      <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                        {group.values.length} capture{group.values.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {group.values.map((val, i) => (
                        <span
                          key={i}
                          className="font-mono text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Zero matches state */}
      {data && text && matches.length === 0 && !error && (
        <div className="text-center py-10 space-y-2 animate-in">
          <div className="text-3xl">∅</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No matches found in the test string.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Try enabling the <span className="font-mono">i</span> flag for case-insensitive matching, or the <span className="font-mono">m</span> flag for multiline.
          </p>
        </div>
      )}

    </div>
  )
}