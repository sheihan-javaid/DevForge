"use client"

import { useState, useCallback } from "react"
import {
  decodeJWT,
  getAlgorithmInfo,
  getClaimDescription,
  formatClaimValue,
  isTimestampClaim,
} from "@/utils/jwt"
import type { JWTDecoded } from "@/utils/jwt"
import CopyButton from "@/components/CopyButton"

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiJ1c3IxMjMiLCJuYW1lIjoiQWxpY2UiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6OTk5OTk5OTk5OX0." +
  "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

// ── Sub-components ────────────────────────────────────────────────────────────

function SegmentPill({
  label, color, chars,
}: {
  label: string
  color: string
  chars: number
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${color}`}>
      <span>{label}</span>
      <span className="opacity-60">{chars} chars</span>
    </div>
  )
}

function ClaimRow({ name, value }: { name: string; value: unknown }) {
  const desc      = getClaimDescription(name)
  const formatted = formatClaimValue(name, value)
  const isTs      = isTimestampClaim(name)

  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="space-y-0.5">
        <div className="font-mono text-xs font-medium text-violet-700 dark:text-violet-400">
          {name}
        </div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
          {desc}
        </div>
      </div>
      <div className={`text-xs break-all leading-relaxed ${isTs ? "text-amber-600 dark:text-amber-400" : "text-gray-700 dark:text-gray-300"}`}>
        {formatted}
      </div>
    </div>
  )
}

function SectionCard({
  label,
  badge,
  badgeColor,
  children,
  actions,
}: {
  label:       string
  badge?:      string
  badgeColor?: string
  children:    React.ReactNode
  actions?:    React.ReactNode
}) {
  return (
    <div className="card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {label}
          </span>
          {badge && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {actions}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function JwtDecoder() {
  const [input,   setInput]   = useState("")
  const [decoded, setDecoded] = useState<JWTDecoded | null>(null)
  const [error,   setError]   = useState<string | undefined>()
  const [hint,    setHint]    = useState<string | undefined>()

  const run = useCallback((raw: string) => {
    if (!raw.trim()) {
      setDecoded(null); setError(undefined); setHint(undefined)
      return
    }
    const result = decodeJWT(raw)
    if (result.ok) {
      setDecoded(result.decoded)
      setError(undefined)
      setHint(undefined)
    } else {
      setDecoded(null)
      setError(result.error)
      setHint(result.hint)
    }
  }, [])

  const handleInput = (val: string) => {
    setInput(val)
    run(val)
  }

  const loadSample = () => {
    setInput(SAMPLE_JWT)
    run(SAMPLE_JWT)
  }

  const handleClear = () => {
    setInput(""); setDecoded(null)
    setError(undefined); setHint(undefined)
  }

  const algInfo = decoded ? getAlgorithmInfo(decoded.header.alg) : null

  return (
    <div className="tool-page">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-mono font-bold text-xs">
            jwt
          </span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            JWT Decoder
          </h1>
          {decoded && (
            <span className={`badge ${decoded.meta.isExpired ? "badge-red" : "badge-green"}`}>
              {decoded.meta.isExpired ? "Expired" : "Valid"}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Decode and inspect JWT header, payload, and claims. Nothing leaves your browser.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <button onClick={loadSample} className="toolbar-btn">
          Load sample
        </button>
        <button onClick={handleClear} className="toolbar-btn-danger">
          Clear
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400 dark:text-gray-500">
          🔒 Decoded client-side only
        </span>
      </div>

      {/* Token input */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Paste your JWT token here — Bearer prefix is stripped automatically..."
            rows={4}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            className={`
              w-full textarea-mono resize-none rounded-xl px-4 py-3
              bg-white dark:bg-gray-900
              text-gray-900 dark:text-gray-100
              placeholder:text-gray-400 dark:placeholder:text-gray-600
              border transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${error
                ? "border-red-300 dark:border-red-700 focus:ring-red-400/20"
                : "border-gray-200 dark:border-gray-700 focus:border-violet-400 focus:ring-violet-400/20"
              }
            `}
          />
        </div>

        {/* Token segments visualised */}
        {input.trim() && !error && (
          <div className="flex flex-wrap gap-2">
            {input.trim().replace(/^Bearer\s+/i, "").split(".").map((part, i) => (
              <SegmentPill
                key={i}
                label={["Header", "Payload", "Signature"][i]}
                chars={part.length}
                color={[
                  "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                  "bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
                  "bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400",
                ][i]}
              />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-0.5">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
            {hint && <p className="text-xs text-red-400 dark:text-red-500">{hint}</p>}
          </div>
        )}
      </div>

      {/* Decoded output */}
      {decoded && (
        <div className="space-y-4 animate-in">

          {/* Meta bar */}
          <div className="stats-bar">
            {[
              { label: "Algorithm",  value: decoded.meta.algorithm },
              { label: "Claims",     value: decoded.meta.claimCount },
              { label: "Issued",     value: decoded.meta.issuedAt     ?? "—" },
              { label: "Expires",    value: decoded.meta.expiresAt    ?? "Never" },
              { label: "Status",     value: decoded.meta.timeUntilExp ?? "No expiry" },
              ...(decoded.meta.hasKid ? [{ label: "Key ID", value: decoded.header.kid as string }] : []),
            ].map(({ label, value }) => (
              <span key={label}>
                <span className="stats-label">{label}: </span>
                <span className={
                  label === "Status" && decoded.meta.isExpired
                    ? "text-red-500 dark:text-red-400"
                    : label === "Status"
                    ? "text-green-600 dark:text-green-400"
                    : ""
                }>
                  {String(value)}
                </span>
              </span>
            ))}
          </div>

          {/* Header */}
          <SectionCard
            label="Header"
            badge={decoded.header.alg}
            badgeColor={
              algInfo?.secure
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }
            actions={
              <CopyButton
                text={JSON.stringify(decoded.header, null, 2)}
                size="sm"
              />
            }
          >
            <div className="space-y-0.5">
              {Object.entries(decoded.header).map(([k, v]) => (
                <ClaimRow key={k} name={k} value={v} />
              ))}
            </div>
            {algInfo && (
              <p className={`mt-3 text-xs px-3 py-2 rounded-lg ${
                algInfo.secure
                  ? "bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400"
              }`}>
                {algInfo.note}
              </p>
            )}
          </SectionCard>

          {/* Payload */}
          <SectionCard
            label="Payload"
            badge={`${decoded.meta.claimCount} claims`}
            badgeColor="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
            actions={
              <CopyButton
                text={JSON.stringify(decoded.payload, null, 2)}
                size="sm"
              />
            }
          >
            <div>
              {Object.entries(decoded.payload).map(([k, v]) => (
                <ClaimRow key={k} name={k} value={v} />
              ))}
            </div>
          </SectionCard>

          {/* Signature */}
          <SectionCard
            label="Signature"
            badge="Cannot be verified client-side"
            badgeColor="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            actions={
              <CopyButton text={decoded.signature} size="sm" />
            }
          >
            <p className="textarea-mono text-xs text-gray-500 dark:text-gray-400 break-all leading-relaxed">
              {decoded.signature}
            </p>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              Signature verification requires the secret key or public key and must be done server-side.
            </p>
          </SectionCard>

          {/* Raw token */}
          <SectionCard
            label="Raw token"
            actions={<CopyButton text={decoded.raw.header + "." + decoded.raw.payload + "." + decoded.raw.signature} size="sm" />}
          >
            <p className="textarea-mono text-xs text-gray-500 dark:text-gray-400 break-all leading-relaxed">
              <span className="text-blue-600 dark:text-blue-400">{decoded.raw.header}</span>
              <span className="text-gray-300 dark:text-gray-600">.</span>
              <span className="text-violet-600 dark:text-violet-400">{decoded.raw.payload}</span>
              <span className="text-gray-300 dark:text-gray-600">.</span>
              <span className="text-pink-600 dark:text-pink-400">{decoded.raw.signature}</span>
            </p>
          </SectionCard>

        </div>
      )}

    </div>
  )
}