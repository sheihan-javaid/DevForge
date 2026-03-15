import Link from "next/link"

const FOOTER_LINKS = [
  {
    group: "Tools",
    links: [
      { label: "JSON Formatter", href: "/tools/json-formatter" },
      { label: "Base64 Encoder", href: "/tools/base64" },
      { label: "JWT Decoder", href: "/tools/jwt-decoder" },
      { label: "UUID Generator", href: "/tools/uuid-generator" },
      { label: "Hash Generator", href: "/tools/hash-generator" },
      { label: "Regex Tester", href: "/tools/regexp-tester" },
    ],
  },
  {
    group: "More Tools",
    links: [
      { label: "Password Generator", href: "/tools/password-generator" },
      { label: "URL Encoder", href: "/tools/url-encoder" },
      { label: "Unix Timestamp", href: "/tools/unix-timestamp" },
      { label: "Diff Checker", href: "/tools/diff-checker" },
      { label: "Lorem Ipsum", href: "/tools/lorem-ipsum" },
      { label: "Cron Parser", href: "/tools/cron-parser" },
    ],
  },
  {
    group: "More",
    links: [
      { label: "String Case", href: "/tools/string-case" },
      { label: "YAML to JSON", href: "/tools/yaml-json" },
      { label: "Random String", href: "/tools/random-string" },
      { label: "Diff Checker", href: "/tools/diff-checker" },
      { label: "Cron Parser", href: "/tools/cron-parser" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-4">

            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg tracking-tight text-gray-900 dark:text-white no-underline hover:opacity-80 transition-opacity"
            >
              <span className="flex items-center justify-center w-7 h-7 rounded-md bg-violet-600 text-white text-xs font-bold">
                D
              </span>
              DevForge
            </Link>

            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Free developer tools for everyday tasks. No sign-up, no tracking,
              everything runs in your browser.
            </p>

            <a
              href="https://github.com/sheihan-javaid/devforge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              GitHub ↗
            </a>

          </div>

          {/* Links */}
          {FOOTER_LINKS.map(({ group, links }) => (
            <div key={group} className="space-y-4">

              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {group}
              </h3>

              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

            </div>
          ))}

        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">

          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} DevForge. All tools are free to use.
          </p>

          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            All tools run client-side — nothing is sent to a server.
          </div>

        </div>

      </div>
    </footer>
  )
}