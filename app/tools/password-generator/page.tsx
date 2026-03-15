"use client"

import { useState, useCallback } from "react"
import {
  generatePassword,
  generateBatch,
  generatePassphrase,
  DEFAULT_OPTIONS,
} from "@/utils/passwordGenerator"
import type {
  PasswordOptions,
  PasswordResult,
  PasswordStrength,
} from "@/utils/passwordGenerator"
import CopyButton from "@/components/CopyButton"

type Mode = "password" | "passphrase"

// ── Sub-components ────────────────────────────────────────────────────────────

function StrengthMeter({ strength, entropy }: { strength: PasswordStrength; entropy: number }) {
  const config: Record<PasswordStrength, { width: string; color: string; bg: string }> = {
    "weak":        { width: "w-1/5",  color: "bg-red-500",    bg: "text-red-500 dark:text-red-400"    },
    "fair":        { width: "w-2/5",  color: "bg-amber-500",  bg: "text-amber-500 dark:text-amber-400" },
    "good":        { width: "w-3/5",  color: "bg-yellow-400", bg: "text-yellow-500 dark:text-yellow-400" },
    "strong":      { width: "w-4/5",  color: "bg-green-500",  bg: "text-green-600 dark:text-green-400" },
    "very-strong": { width: "w-full", color: "bg-green-600",  bg: "text-green-600 dark:text-green-400" },
  }
  const { width, color, bg } = config[strength]

  return (
    <div className="space-y-1.5">
      <div className="strength-track">
        <div className={`h-full rounded-full transition-all duration-500 ${width} ${color}`} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-medium capitalize ${bg}`}>
          {strength.replace("-", " ")}
        </span>
        <span className="text-gray-400 dark:text-gray-500">
          {entropy} bits entropy
        </span>
      </div>
    </div>
  )
}

function PasswordRow({
  result,
  index,
}: {
  result: PasswordResult
  index:  number
}) {
  return (
    <div className="
      group flex items-center justify-between gap-3
      px-4 py-2.5
      border-b border-gray-100 dark:border-gray-800 last:border-0
      hover:bg-gray-50 dark:hover:bg-gray-900/60
      transition-colors
    ">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] text-gray-300 dark:text-gray-600 w-5 text-right shrink-0 select-none">
          {index + 1}
        </span>
        <span className="textarea-mono text-sm text-gray-800 dark:text-gray-200 truncate">
          {result.password}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`
          hidden group-hover:inline text-[10px] font-medium px-2 py-0.5 rounded-full
          ${result.strength === "very-strong" || result.strength === "strong"
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : result.strength === "good"
            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
            : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }
        `}>
          {result.label}
        </span>
        <CopyButton text={result.password} size="sm" />
      </div>
    </div>
  )
}

function OptionToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label:       string
  description: string
  checked:     boolean
  onChange:    (v: boolean) => void
  disabled?:   boolean
}) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 ${disabled ? "opacity-40" : ""}`}>
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {description}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full
          transition-colors shrink-0
          ${checked ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"}
          ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        <span className={`
          inline-block h-3.5 w-3.5 rounded-full bg-white shadow
          transition-transform
          ${checked ? "translate-x-4.5" : "translate-x-0.5"}
        `} />
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PasswordGeneratorPage() {
  const [mode,      setMode]      = useState<Mode>("password")
  const [options,   setOptions]   = useState<PasswordOptions>(DEFAULT_OPTIONS)
  const [results,   setResults]   = useState<PasswordResult[]>([])
  const [count,     setCount]     = useState(1)
  const [wordCount, setWordCount] = useState(4)
  const [separator, setSeparator] = useState("-")

  // ── Generate ───────────────────────────────────────────────────────────────

  const generate = useCallback(() => {
    if (mode === "passphrase") {
      const res = Array.from({ length: count }, () =>
        generatePassphrase(wordCount, separator)
      )
      setResults(res)
    } else {
      const res = generateBatch(count, options)
      setResults(res)
    }
  }, [mode, options, count, wordCount, separator])

  const updateOption = (patch: Partial<PasswordOptions>) => {
    const next = { ...options, ...patch }
    setOptions(next)
  }

  // At least one char type must be enabled
  const enabledCount = [
    options.uppercase,
    options.lowercase,
    options.numbers,
    options.symbols,
  ].filter(Boolean).length

  const canToggle = (key: keyof PasswordOptions) => {
    if (!options[key]) return true
    return enabledCount > 1
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const latest = results[0] ?? null

  const allPasswords = results.map((r) => r.password).join("\n")

  const COUNT_PRESETS = [1, 5, 10, 25]

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-sm">
            🔑
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Password Generator
          </h1>
          {latest && (
            <span className={`badge ${
              latest.strength === "very-strong" || latest.strength === "strong"
                ? "badge-green"
                : latest.strength === "good"
                ? "badge-amber"
                : "badge-red"
            }`}>
              {latest.label}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generate strong, secure passwords with entropy scoring and crack time estimates.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="toggle-group w-fit">
        {(["password", "passphrase"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResults([]) }}
            className={mode === m ? "toggle-item-active" : "toggle-item"}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="card rounded-xl p-5 space-y-5">

        {mode === "password" ? (
          <>
            {/* Length slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="section-label">Length</span>
                <span className="text-sm font-mono font-semibold text-violet-700 dark:text-violet-400">
                  {options.length}
                </span>
              </div>
              <input
                type="range"
                min={4}
                max={128}
                value={options.length}
                onChange={(e) => updateOption({ length: Number(e.target.value) })}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
                <span>4</span>
                <span>32</span>
                <span>64</span>
                <span>128</span>
              </div>
            </div>

            {/* Character options */}
            <div className="space-y-0 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden px-4">
              <OptionToggle
                label="Uppercase"
                description="A – Z"
                checked={options.uppercase}
                onChange={(v) => updateOption({ uppercase: v })}
                disabled={!canToggle("uppercase")}
              />
              <OptionToggle
                label="Lowercase"
                description="a – z"
                checked={options.lowercase}
                onChange={(v) => updateOption({ lowercase: v })}
                disabled={!canToggle("lowercase")}
              />
              <OptionToggle
                label="Numbers"
                description="0 – 9"
                checked={options.numbers}
                onChange={(v) => updateOption({ numbers: v })}
                disabled={!canToggle("numbers")}
              />
              <OptionToggle
                label="Symbols"
                description="! @ # $ % ^ & *"
                checked={options.symbols}
                onChange={(v) => updateOption({ symbols: v })}
                disabled={!canToggle("symbols")}
              />
              <OptionToggle
                label="Exclude ambiguous"
                description="Removes 0, O, l, 1, I"
                checked={options.excludeAmbiguous}
                onChange={(v) => updateOption({ excludeAmbiguous: v })}
              />
            </div>
          </>
        ) : (
          <>
            {/* Passphrase word count */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="section-label">Word count</span>
                <span className="text-sm font-mono font-semibold text-violet-700 dark:text-violet-400">
                  {wordCount}
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={10}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </div>

            {/* Separator */}
            <div className="space-y-2">
              <span className="section-label">Separator</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Hyphen",  value: "-"  },
                  { label: "Dot",     value: "."  },
                  { label: "Slash",   value: "/"  },
                  { label: "Space",   value: " "  },
                  { label: "None",    value: ""   },
                ].map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setSeparator(value)}
                    className={`
                      text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium
                      ${separator === value
                        ? "bg-violet-600 border-violet-600 text-white"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Count */}
        <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="section-label">Generate count</span>
          <div className="flex flex-wrap items-center gap-2">
            {COUNT_PRESETS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`
                  w-10 h-8 rounded-lg text-xs font-medium border transition-colors
                  ${count === n
                    ? "bg-violet-600 border-violet-600 text-white"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300"
                  }
                `}
              >
                {n}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-20 text-center text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            />
          </div>
        </div>

      </div>

      {/* Generate button */}
      <button onClick={generate} className="btn-primary">
        Generate {count} {mode === "passphrase" ? "passphrase" : "password"}{count > 1 ? "s" : ""}
      </button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4 animate-in">

          {/* Strength meter for first result */}
          {latest && mode === "password" && (
            <StrengthMeter
              strength={latest.strength}
              entropy={latest.entropy}
            />
          )}

          {/* Crack time */}
          {latest && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 px-1">
              <span className="text-gray-300 dark:text-gray-600">Crack time:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {latest.crackTime}
              </span>
              <span className="text-gray-300 dark:text-gray-600 ml-2">at 10B guesses/sec</span>
            </div>
          )}

          {/* Password list */}
          <div className="card rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <span className="section-label">
                {results.length} {mode === "passphrase" ? "passphrase" : "password"}{results.length > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={generate} className="toolbar-btn">
                  ↻ Regenerate
                </button>
                <CopyButton text={allPasswords} size="sm" />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {results.map((result, i) => (
                <PasswordRow key={i} result={result} index={i} />
              ))}
            </div>
          </div>

          {/* Stats bar */}
          {latest && (
            <div className="stats-bar">
              {[
                { label: "Length",   value: latest.password.length          },
                { label: "Entropy",  value: `${latest.entropy} bits`        },
                { label: "Strength", value: latest.label                    },
                { label: "Crack",    value: latest.crackTime                },
                ...(mode === "password" ? [
                  { label: "Charset", value: `${
                    [
                      options.uppercase ? "A-Z" : "",
                      options.lowercase ? "a-z" : "",
                      options.numbers   ? "0-9" : "",
                      options.symbols   ? "!@#" : "",
                    ].filter(Boolean).join(" ")
                  }` }
                ] : [])
              ].map(({ label, value }) => (
                <span key={label}>
                  <span className="stats-label">{label}: </span>
                  {value}
                </span>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Tips */}
      <div className="card rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          Tips for strong passwords
        </h2>
        <ul className="space-y-2">
          {[
            "Use at least 16 characters for sensitive accounts.",
            "Enable all character types for maximum entropy.",
            "Use a unique password for every account.",
            "Consider passphrases — easier to remember, just as secure.",
            "Store passwords in a password manager, never in plain text.",
          ].map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="text-violet-500 mt-0.5 shrink-0">✓</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}