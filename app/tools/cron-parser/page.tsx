"use client"

import { useState, useCallback } from "react"
import {
  parseCron,
  PRESETS,
} from "@/utils/cronParser"
import type {
  CronResult,
  CronData,
  CronFields,
  CronField,
} from "@/utils/cronParser"
import CopyButton from "@/components/CopyButton"

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldPill({
  label,
  raw,
  description,
  isError,
}: {
  label:       string
  raw:         string
  description: string
  isError:     boolean
}) {
  return (
    <div className={`
      flex flex-col gap-1 px-3 py-2.5 rounded-xl border text-center
      transition-colors
      ${isError
        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10"
        : "card"
      }
    `}>
      <span className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {label}
      </span>
      <span className={`
        textarea-mono text-sm font-semibold
        ${isError
          ? "text-red-600 dark:text-red-400"
          : "text-violet-700 dark:text-violet-400"
        }
      `}>
        {raw}
      </span>
      <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
        {description}
      </span>
    </div>
  )
}

function NextRunRow({
  date,
  index,
}: {
  date:  Date
  index: number
}) {
  const now      = new Date()
  const diffMs   = date.getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  const diffHrs  = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  const relative =
    diffMins < 60  ? `in ${diffMins}m` :
    diffHrs  < 24  ? `in ${diffHrs}h`  :
    `in ${diffDays}d`

  return (
    <div className="
      flex items-center justify-between gap-4
      px-4 py-2.5
      border-b border-gray-100 dark:border-gray-800 last:border-0
    ">
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-gray-300 dark:text-gray-600 w-4 text-right select-none">
          {index + 1}
        </span>
        <span className="textarea-mono text-xs text-gray-700 dark:text-gray-300">
          {date.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      </div>
      <span className="text-xs text-violet-600 dark:text-violet-400 shrink-0">
        {relative}
      </span>
    </div>
  )
}

function CronVisualizer({ fields }: { fields: CronFields }) {
  const FIELD_LABELS: { key: keyof CronFields; label: string }[] = [
    { key: "minute",  label: "Minute"       },
    { key: "hour",    label: "Hour"         },
    { key: "day",     label: "Day of month" },
    { key: "month",   label: "Month"        },
    { key: "weekday", label: "Day of week"  },
  ]

  return (
    <div className="grid grid-cols-5 gap-2">
      {FIELD_LABELS.map(({ key, label }) => {
        const field = fields[key]
        return (
          <FieldPill
            key={key}
            label={label}
            raw={field.raw}
            description={field.description}
            isError={false}
          />
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CronParserPage() {
  const [input,   setInput]   = useState("")
  const [result,  setResult]  = useState<CronResult | null>(null)

  // ── Run ────────────────────────────────────────────────────────────────────

  const run = useCallback((expr: string) => {
    if (!expr.trim()) { setResult(null); return }
    setResult(parseCron(expr))
  }, [])

  const handleInput = (val: string) => {
    setInput(val)
    run(val)
  }

  const loadPreset = (expression: string) => {
    setInput(expression)
    run(expression)
  }

  const handleClear = () => {
    setInput("")
    setResult(null)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const data  = result?.ok ? result.data  : null
  const error = result && !result.ok ? result.error : undefined
  const hint  = result && !result.ok ? result.hint  : undefined

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-sm">
            ⏱
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Cron Parser
          </h1>
          {data && (
            <span className="badge badge-green">Valid</span>
          )}
          {error && (
            <span className="badge badge-red">Invalid</span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Parse and explain cron expressions in plain English with next run times.
        </p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <span className="section-label">Common schedules</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => loadPreset(preset.expression)}
              title={preset.description}
              className={`
                text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium
                ${input === preset.expression
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

      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="section-label">Expression</span>
          <div className="flex items-center gap-2">
            {input && (
              <CopyButton text={input} size="sm" />
            )}
            <button onClick={handleClear} className="toolbar-btn-danger">
              Clear
            </button>
          </div>
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Enter a cron expression e.g. */5 * * * *"
          spellCheck={false}
          autoComplete="off"
          className={`
            w-full textarea-mono px-4 py-3 rounded-xl border text-sm
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-offset-0
            transition-colors
            ${error
              ? "border-red-300 dark:border-red-700 focus:ring-red-400/20"
              : "border-gray-200 dark:border-gray-700 focus:border-violet-400 dark:focus:border-violet-600 focus:ring-violet-400/20"
            }
          `}
        />

        {/* Field labels */}
        <div className="grid grid-cols-5 gap-2 px-1">
          {["Minute", "Hour", "Day", "Month", "Weekday"].map((label) => (
            <div
              key={label}
              className="text-[10px] text-center text-gray-400 dark:text-gray-500 uppercase tracking-widest"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-0.5">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
            {hint && (
              <p className="text-xs text-red-400 dark:text-red-500">{hint}</p>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-5 animate-in">

          {/* Summary card */}
          <div className="card rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                {data.preset && (
                  <span className="badge badge-violet text-[10px]">
                    {data.preset}
                  </span>
                )}
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {data.summary}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {data.description}
                </p>
              </div>
              <CopyButton text={data.expression} size="sm" />
            </div>

            {/* Shorthand alternatives */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Expression:
                <span className="textarea-mono ml-2 text-violet-700 dark:text-violet-400 font-semibold">
                  {data.expression}
                </span>
              </p>
            </div>
          </div>

          {/* Field visualizer */}
          <div className="space-y-2">
            <span className="section-label">Field breakdown</span>
            <CronVisualizer fields={data.fields} />
          </div>

          {/* Field details table */}
          <div className="card rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <span className="section-label">Field details</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {(
                [
                  { key: "minute",  label: "Minute",        range: "0–59"  },
                  { key: "hour",    label: "Hour",          range: "0–23"  },
                  { key: "day",     label: "Day of month",  range: "1–31"  },
                  { key: "month",   label: "Month",         range: "1–12"  },
                  { key: "weekday", label: "Day of week",   range: "0–6"   },
                ] as { key: keyof CronFields; label: string; range: string }[]
              ).map(({ key, label, range }) => {
                const field = data.fields[key]
                return (
                  <div
                    key={key}
                    className="grid grid-cols-[100px_60px_80px_1fr] gap-3 items-center px-4 py-3 text-xs"
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {label}
                    </span>
                    <span className="textarea-mono text-violet-700 dark:text-violet-400 font-semibold">
                      {field.raw}
                    </span>
                    <span className="badge badge-violet text-[10px] w-fit">
                      {field.type}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {field.description}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Next runs */}
          {data.nextRuns.length > 0 && (
            <div className="space-y-2">
              <span className="section-label">Next {data.nextRuns.length} runs</span>
              <div className="card rounded-xl overflow-hidden">
                {data.nextRuns.map((date, i) => (
                  <NextRunRow key={i} date={date} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Cron syntax reference */}
          <div className="space-y-2">
            <span className="section-label">Syntax reference</span>
            <div className="card rounded-xl overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { symbol: "*",    meaning: "Every value",                   example: "* = every minute"         },
                  { symbol: "*/n",  meaning: "Every n-th value",              example: "*/5 = every 5 minutes"    },
                  { symbol: "n",    meaning: "Specific value",                example: "3 = at minute 3"          },
                  { symbol: "n-m",  meaning: "Range of values",               example: "1-5 = Monday to Friday"   },
                  { symbol: "n,m",  meaning: "List of values",                example: "0,6 = Sunday and Saturday" },
                  { symbol: "n-m/s",meaning: "Range with step",               example: "0-12/2 = every 2 hours"   },
                ].map(({ symbol, meaning, example }) => (
                  <div
                    key={symbol}
                    className="grid grid-cols-[60px_1fr_1fr] gap-3 items-center px-4 py-2.5 text-xs"
                  >
                    <span className="textarea-mono font-bold text-violet-700 dark:text-violet-400">
                      {symbol}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {meaning}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">
                      {example}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Shorthand reference */}
          <div className="space-y-2">
            <span className="section-label">Shorthand expressions</span>
            <div className="card rounded-xl overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { shorthand: "@yearly",   equivalent: "0 0 1 1 *",   meaning: "Once a year"    },
                  { shorthand: "@monthly",  equivalent: "0 0 1 * *",   meaning: "Once a month"   },
                  { shorthand: "@weekly",   equivalent: "0 0 * * 0",   meaning: "Once a week"    },
                  { shorthand: "@daily",    equivalent: "0 0 * * *",   meaning: "Once a day"     },
                  { shorthand: "@midnight", equivalent: "0 0 * * *",   meaning: "At midnight"    },
                  { shorthand: "@hourly",   equivalent: "0 * * * *",   meaning: "Once an hour"   },
                ].map(({ shorthand, equivalent, meaning }) => (
                  <div
                    key={shorthand}
                    className="grid grid-cols-[100px_140px_1fr] gap-3 items-center px-4 py-2.5 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                    onClick={() => loadPreset(shorthand)}
                  >
                    <span className="textarea-mono font-bold text-violet-700 dark:text-violet-400">
                      {shorthand}
                    </span>
                    <span className="textarea-mono text-gray-500 dark:text-gray-400">
                      {equivalent}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {meaning}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}