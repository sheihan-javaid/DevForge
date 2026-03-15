"use client"

import { useState, useCallback } from "react"
import {
  generateLorem,
  PRESETS,
  DEFAULT_OPTIONS,
} from "@/utils/loremIpsum"
import type {
  LoremOptions,
  LoremUnit,
  LoremFormat,
  LoremStats,
} from "@/utils/loremIpsum"
import CopyButton from "@/components/CopyButton"

// ── Sub-components ────────────────────────────────────────────────────────────

function CountStepper({
  value,
  onChange,
  unit,
}: {
  value:    number
  onChange: (v: number) => void
  unit:     LoremUnit
}) {
  const limits: Record<LoremUnit, [number, number]> = {
    words:      [1,  500],
    sentences:  [1,  100],
    paragraphs: [1,   20],
  }
  const [min, max] = limits[unit]

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const v = Math.max(min, Math.min(max, Number(e.target.value)))
          onChange(v)
        }}
        className="w-16 text-center text-sm font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
      >
        +
      </button>
      <span className="text-xs text-gray-400 dark:text-gray-500">
        {unit}
      </span>
    </div>
  )
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options:  { key: T; label: string }[]
  value:    T
  onChange: (v: T) => void
}) {
  return (
    <div className="toggle-group">
      {options.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={value === key ? "toggle-item-active" : "toggle-item"}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LoremIpsumPage() {
  const [options, setOptions]   = useState<LoremOptions>(DEFAULT_OPTIONS)
  const [output,  setOutput]    = useState("")
  const [stats,   setStats]     = useState<LoremStats | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const run = useCallback((opts: LoremOptions) => {
    const result = generateLorem(opts)
    setOutput(result.output)
    setStats(result.stats)
  }, [])

  const updateOptions = (patch: Partial<LoremOptions>) => {
    const next = { ...options, ...patch }
    setOptions(next)
    setActivePreset(null)
    if (output) run(next)
  }

  const applyPreset = (label: string, presetOpts: Partial<LoremOptions>) => {
    const next = { ...DEFAULT_OPTIONS, ...presetOpts }
    setOptions(next)
    setActivePreset(label)
    run(next)
  }

  const handleGenerate = () => {
    run(options)
    setActivePreset(null)
  }

  const handleClear = () => {
    setOutput("")
    setStats(null)
    setActivePreset(null)
  }

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-sm">
            ¶
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Lorem Ipsum Generator
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Generate placeholder text by words, sentences, or paragraphs — plain, HTML, or Markdown.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <span className="section-label">Quick presets</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.label, preset.options)}
              className={`
                text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium
                ${activePreset === preset.label
                  ? "bg-violet-600 border-violet-600 text-white"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400"
                }
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="card rounded-xl p-5 space-y-5">

        {/* Unit + Count */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1.5">
            <label className="section-label">Unit</label>
            <ToggleGroup<LoremUnit>
              options={[
                { key: "words",      label: "Words"      },
                { key: "sentences",  label: "Sentences"  },
                { key: "paragraphs", label: "Paragraphs" },
              ]}
              value={options.unit}
              onChange={(unit) => updateOptions({ unit })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="section-label">Count</label>
            <CountStepper
              value={options.count}
              unit={options.unit}
              onChange={(count) => updateOptions({ count })}
            />
          </div>
        </div>

        {/* Format */}
        <div className="space-y-1.5">
          <label className="section-label">Output format</label>
          <ToggleGroup<LoremFormat>
            options={[
              { key: "plain",    label: "Plain text" },
              { key: "html",     label: "HTML"       },
              { key: "markdown", label: "Markdown"   },
            ]}
            value={options.format}
            onChange={(format) => updateOptions({ format })}
          />
        </div>

        {/* Advanced — word / sentence length */}
        {options.unit !== "words" && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="section-label">Sentence length (words)</span>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 w-8">Min</span>
                <input
                  type="range"
                  min={3}
                  max={options.maxWords - 1}
                  value={options.minWords}
                  onChange={(e) => updateOptions({ minWords: Number(e.target.value) })}
                  className="w-28 accent-violet-600"
                />
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-5">
                  {options.minWords}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 w-8">Max</span>
                <input
                  type="range"
                  min={options.minWords + 1}
                  max={40}
                  value={options.maxWords}
                  onChange={(e) => updateOptions({ maxWords: Number(e.target.value) })}
                  className="w-28 accent-violet-600"
                />
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-5">
                  {options.maxWords}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Paragraph sentence range */}
        {options.unit === "paragraphs" && (
          <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <span className="section-label">Sentences per paragraph</span>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 w-8">Min</span>
                <input
                  type="range"
                  min={1}
                  max={options.maxSents - 1}
                  value={options.minSents}
                  onChange={(e) => updateOptions({ minSents: Number(e.target.value) })}
                  className="w-28 accent-violet-600"
                />
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-5">
                  {options.minSents}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 w-8">Max</span>
                <input
                  type="range"
                  min={options.minSents + 1}
                  max={20}
                  value={options.maxSents}
                  onChange={(e) => updateOptions({ maxSents: Number(e.target.value) })}
                  className="w-28 accent-violet-600"
                />
                <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-5">
                  {options.maxSents}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Start with Lorem toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Start with "Lorem ipsum"
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Always begin with the classic opener
            </p>
          </div>
          <button
            role="switch"
            aria-checked={options.startWithLorem}
            onClick={() => updateOptions({ startWithLorem: !options.startWithLorem })}
            className={`
              relative inline-flex h-5 w-9 items-center rounded-full transition-colors
              ${options.startWithLorem ? "bg-violet-600" : "bg-gray-200 dark:bg-gray-700"}
            `}
          >
            <span className={`
              inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform
              ${options.startWithLorem ? "translate-x-4.5" : "translate-x-0.5"}
            `} />
          </button>
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        className="btn-primary"
      >
        Generate
      </button>

      {/* Output */}
      {output && (
        <div className="space-y-3 animate-in">

          {/* Stats bar */}
          {stats && (
            <div className="stats-bar">
              {[
                { label: "Paragraphs", value: stats.paragraphs },
                { label: "Sentences",  value: stats.sentences  },
                { label: "Words",      value: stats.words.toLocaleString()      },
                { label: "Characters", value: stats.characters.toLocaleString() },
              ].map(({ label, value }) => (
                <span key={label}>
                  <span className="stats-label">{label}: </span>
                  {value}
                </span>
              ))}
            </div>
          )}

          {/* Output card */}
          <div className="card rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <span className="section-label">Output</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerate}
                  className="toolbar-btn"
                >
                  ↻ Regenerate
                </button>
                <button
                  onClick={handleClear}
                  className="toolbar-btn-danger"
                >
                  Clear
                </button>
                <CopyButton text={output} size="sm" />
              </div>
            </div>

            {/* Rendered preview for HTML format */}
            {options.format === "html" ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
                <div className="p-4">
                  <div className="section-label mb-2">Source</div>
                  <pre className="textarea-mono text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">
                    {output}
                  </pre>
                </div>
                <div className="p-4">
                  <div className="section-label mb-2">Preview</div>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: output }}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {output}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}