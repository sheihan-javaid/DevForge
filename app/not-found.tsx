import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">

      {/* Code */}
      <div className="space-y-2">
        <p className="text-8xl font-bold text-gray-100 dark:text-gray-800 select-none">
          404
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Page not found
          </p>
        </div>
      </div>

      {/* Message */}
      <div className="space-y-2 max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          This page doesn't exist
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          The page you're looking for may have been moved, deleted, or never existed.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/#tools"
          className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium transition-colors"
        >
          Browse tools
        </Link>
      </div>

      {/* Tool suggestions */}
      <div className="pt-4 space-y-3 w-full max-w-sm">
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Popular tools
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "JSON Formatter",  href: "/tools/json-formatter"  },
            { label: "Base64",          href: "/tools/base64"          },
            { label: "JWT Decoder",     href: "/tools/jwt-decoder"     },
            { label: "UUID Generator",  href: "/tools/uuid-generator"  },
            { label: "Hash Generator",  href: "/tools/hash-generator"  },
            { label: "Regex Tester",    href: "/tools/regexp-tester"   },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="
                px-3 py-2 rounded-lg text-xs font-medium text-center
                border border-gray-200 dark:border-gray-700
                text-gray-600 dark:text-gray-400
                hover:border-violet-300 dark:hover:border-violet-700
                hover:text-violet-600 dark:hover:text-violet-400
                bg-white dark:bg-gray-900
                transition-colors
              "
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}