"use client"

import { useState, useEffect } from "react"
import {
  unixToDate,
  dateToUnix,
  nowTimestamp,
  formatInTimezone,
  COMMON_TIMEZONES,
} from "@/utils/unixTimestamp"
import type { TimestampData } from "@/utils/unixTimestamp"
import CopyButton from "@/components/CopyButton"

type Mode = "unix-to-date" | "date-to-unix"

// ── Sub-components ────────────────────────────────────────────────────────────

function OutputRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label:      string
  value:      string
  mono?:      boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-400 dark:text-gray-500 w-28 shrink-0 pt-0.5">
        {label}
      </span>
      <span className={`
        text-xs flex-1 break-all leading-relaxed
        ${mono      ? "font-mono"                                          : ""}
        ${highlight ? "text-violet-700 dark:text-violet-400 font-medium"  : "text-gray-700 dark:text-gray-300"}
      `}>
        {value}
      </span>
      <CopyButton text={value} size="sm" />
    </div>
  )
}

function DatePartsGrid({ data }: { data: TimestampData }) {
  const { parts } = data
  const cells = [
    { label: "Year",     value: parts.year },
    { label: "Month",    value: `${parts.month} — ${parts.monthName}` },
    { label: "Day",      value: parts.day },
    { label: "Weekday",  value: parts.weekday },
    { label: "Hour",     value: String(parts.hour).padStart(2, "0") },
    { label: "Minute",   value: String(parts.minute).padStart(2, "0") },
    { label: "Second",   value: String(parts.second).padStart(2, "0") },
    { label: "Timezone", value: `${parts.timezone} (${parts.offsetLabel})` },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cells.map(({ label, value }) => (
        <div
          key={label}
          className="card rounded-xl px-3 py-2.5 space-y-0.5"
        >
          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {label}
          </div>
          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 font-mono">
            {value}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UnixTimestamp() {
  const [mode,     setMode]     = useState<Mode>("unix-to-date")
  const [input,    setInput]    = useState("")
  const [data,     setData]     = useState<TimestampData | null>(null)
  const [unixOut,  setUnixOut]  = useState<{ unix: number; unixMs: number } | null>(null)
  const [error,    setError]    = useState<string | undefined>()
  const [hint,     setHint]     = useState<string | undefined>()
  const [timezone, setTimezone] = useState("UTC")
  const [now,      setNow]      = useState<TimestampData>(nowTimestamp())

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setNow(nowTimestamp()), 1000)
    return () => clearInterval(id)
  }, [])

  const run = (raw: string, m: Mode) => {
    if (!raw.trim()) {
      setData(null); setUnixOut(null)
      setError(undefined); setHint(undefined)
      return
    }

    if (m === "unix-to-date") {
      const result = unixToDate(raw)
      if (result.ok) {
        setData(result.data); setUnixOut(null)
        setError(undefined);  setHint(undefined)
      } else {
        setData(null)
        setError(result.error)
        setHint(result.hint)
      }
    } else {
      const result = dateToUnix(raw)
      if (result.ok) {
        setUnixOut({ unix: result.unix, unixMs: result.unixMs })
        setData(null); setError(undefined); setHint(undefined)
      } else {
        setUnixOut(null)
        setError(result.error)
        setHint(result.hint)
      }
    }
  }

  const handleInput = (val: string) => {
    setInput(val)
    run(val, mode)
  }

  const handleModeChange = (m: Mode) => {
    setMode(m)
    setInput("")
    setData(null); setUnixOut(null)
    setError(undefined); setHint(undefined)
  }

  const useNow = () => {
    const val = String(now.unix)
    setMode("unix-to-date")
    setInput(val)
    run(val, "unix-to-date")
  }

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-xs">
            ts
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Unix Timestamp Converter
          </h1>
          {data?.isFuture && (
            <span className="badge badge-violet">Future</span>
          )}
          {data && !data.isFuture && (
            <span className="badge badge-green">Past</span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Convert Unix timestamps to human-readable dates and back.
        </p>
      </div>

      {/* Live clock */}
      <div className="card rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">
            Current time
          </div>
          <div className="font-mono text-sm text-gray-800 dark:text-gray-200">
            {now.local}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {now.relative}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="font-mono text-lg font-semibold text-violet-700 dark:text-violet-400">
              {now.unix.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500">
              Unix seconds
            </div>
          </div>
          <button
            onClick={useNow}
            className="toolbar-btn"
          >
            Use now →
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="toggle-group">
          {([
            { key: "unix-to-date", label: "Unix → Date" },
            { key: "date-to-unix", label: "Date → Unix" },
          ] as { key: Mode; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleModeChange(key)}
              className={mode === key ? "toggle-item-active" : "toggle-item"}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <button
          onClick={() => { setInput(""); setData(null); setUnixOut(null); setError(undefined) }}
          className="toolbar-btn-danger"
        >
          Clear
        </button>
      </div>

      {/* Input */}
      <div className="space-y-2">
        <input
          type="text"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={
            mode === "unix-to-date"
              ? "Enter Unix timestamp — e.g. 1704067200"
              : 'Enter date string — e.g. "2024-01-01T12:00:00Z"'
          }
          spellCheck={false}
          className={`
            w-full px-4 py-3 rounded-xl border text-sm font-mono
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            focus:outline-none focus:ring-2 focus:ring-offset-0
            transition-colors
            ${error
              ? "border-red-300 dark:border-red-700 focus:ring-red-400/20"
              : "border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-violet-400/20"
            }
          `}
        />

        {/* ms auto-detect notice */}
        {data?.isMsInput && (
          <p className="text-xs text-amber-600 dark:text-amber-400 px-1">
            ⚡ Detected milliseconds input — converted to seconds automatically.
          </p>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-0.5">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
            {hint && <p className="text-xs text-red-400 dark:text-red-500">{hint}</p>}
          </div>
        )}
      </div>

      {/* Unix → Date output */}
      {data && (
        <div className="space-y-4 animate-in">

          {/* Formats */}
          <div className="card rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <span className="section-label">Formats</span>
            </div>
            <div className="px-4">
              <OutputRow label="Unix (s)"   value={String(data.unix)}   mono highlight />
              <OutputRow label="Unix (ms)"  value={String(data.unixMs)} mono />
              <OutputRow label="ISO 8601"   value={data.iso}            mono />
              <OutputRow label="UTC"        value={data.utc}            mono />
              <OutputRow label="Local"      value={data.local} />
              <OutputRow label="Relative"   value={data.relative} />
            </div>
          </div>

          {/* Date parts */}
          <div className="space-y-3">
            <span className="section-label">Date parts</span>
            <DatePartsGrid data={data} />
          </div>

          {/* Timezone */}
          <div className="card rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 flex items-center justify-between">
              <span className="section-label">Timezone view</span>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                {formatInTimezone(data.unix, timezone)}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Date → Unix output */}
      {unixOut && (
        <div className="card rounded-xl overflow-hidden animate-in">
          <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
            <span className="section-label">Result</span>
          </div>
          <div className="px-4">
            <OutputRow label="Unix (s)"  value={String(unixOut.unix)}   mono highlight />
            <OutputRow label="Unix (ms)" value={String(unixOut.unixMs)} mono />
          </div>
        </div>
      )}

    </div>
  )
}