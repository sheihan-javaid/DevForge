type Props = {
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  placeholder?: string
  label?: string
  rows?: number
  error?: string
  hint?: string
  actions?: React.ReactNode  // slot for CopyButton, Clear, etc.
}

export default function TextAreaBox({
  value,
  onChange,
  readOnly = false,
  placeholder,
  label,
  rows = 12,
  error,
  hint,
  actions,
}: Props) {
  const hasError = Boolean(error)

  return (
    <div className="flex flex-col gap-1.5 w-full">

      {/* Label row */}
      {(label || actions) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {label}
            </label>
          )}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          className={`
            w-full resize-y rounded-xl px-4 py-3
            font-mono text-sm leading-relaxed
            bg-white dark:bg-gray-900
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-600
            border transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${readOnly
              ? "cursor-default select-all bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300"
              : "hover:border-gray-300 dark:hover:border-gray-600"
            }
            ${hasError
              ? "border-red-400 dark:border-red-600 focus:ring-red-400/30"
              : "border-gray-200 dark:border-gray-700 focus:border-violet-400 dark:focus:border-violet-600 focus:ring-violet-400/20"
            }
          `}
        />

        {/* Read-only badge */}
        {readOnly && (
          <span className="absolute top-2.5 right-3 text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 select-none">
            READ ONLY
          </span>
        )}
      </div>

      {/* Footer: error or hint */}
      {(error || hint) && (
        <p className={`text-xs px-1 ${hasError ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
          {error ?? hint}
        </p>
      )}

    </div>
  )
}