"use client"

import { useState } from "react"

type Props = {
  text: string
  size?: "sm" | "md"
}

export default function CopyButton({ text, size = "md" }: Props) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle")

  const copy = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setStatus("copied")
      setTimeout(() => setStatus("idle"), 2000)
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 2000)
    }
  }

  const config = {
    idle:   { label: "Copy",    icon: "⧉", classes: "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-violet-300 hover:text-violet-600 dark:hover:border-violet-700 dark:hover:text-violet-400" },
    copied: { label: "Copied!", icon: "✓", classes: "border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20" },
    error:  { label: "Failed",  icon: "✕", classes: "border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20" },
  }

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
  }

  const { label, icon, classes } = config[status]

  return (
    <button
      onClick={copy}
      disabled={status !== "idle"}
      aria-label="Copy to clipboard"
      className={`
        inline-flex items-center font-medium rounded-lg border
        bg-white dark:bg-gray-900
        transition-all duration-150
        disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${classes}
      `}
    >
      <span className="text-xs leading-none">{icon}</span>
      {label}
    </button>
  )
}