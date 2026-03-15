import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets:  ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets:  ["latin"],
})

export const metadata: Metadata = {
  title: {
    default:  "DevForge — Free Developer Tools",
    template: "%s | DevForge",
  },
  description:
    "Free online developer tools. JSON formatter, Base64 encoder, JWT decoder, UUID generator, Hash generator, Regex tester and more. No sign-up required.",
  keywords: [
    "developer tools",
    "json formatter",
    "base64 encoder",
    "jwt decoder",
    "uuid generator",
    "hash generator",
    "regex tester",
    "password generator",
    "url encoder",
    "unix timestamp converter",
    "diff checker",
    "lorem ipsum generator",
    "cron parser",
    "string case converter",
    "yaml to json",
    "random string generator",
    "free developer tools",
    "online developer tools",
  ],
  metadataBase: new URL("https://devforge.io"),
  authors:      [{ name: "DevForge" }],
  creator:      "DevForge",
  publisher:    "DevForge",
  icons: {
    icon: [
      { url: "/icons/favicon.ico",       sizes: "any"                       },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
    other: [
      { rel: "android-chrome-192x192", url: "/icons/android-chrome-192x192.png" },
      { rel: "android-chrome-512x512", url: "/icons/android-chrome-512x512.png" },
    ],
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },
  openGraph: {
    title:       "DevForge — Free Developer Tools",
    description: "Free online developer tools. JSON formatter, Base64 encoder, JWT decoder, UUID generator and more. No sign-up required.",
    url:         "https://devforge.io",
    siteName:    "DevForge",
    type:        "website",
    locale:      "en_US",
    images: [
      {
        url:    "/icons/android-chrome-512x512.png",
        width:  512,
        height: 512,
        alt:    "DevForge",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "DevForge — Free Developer Tools",
    description: "Free online developer tools. No sign-up required.",
    creator:     "@devforge",
    images:      ["/icons/android-chrome-512x512.png"],
  },
  alternates: {
    canonical: "https://devforge.io",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── Prevent dark mode flash on load ───────────────────────────── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem("devforge:theme");
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                if (stored === "dark" || (!stored && prefersDark)) {
                  document.documentElement.classList.add("dark");
                }
              } catch {}
            `,
          }}
        />
        {/* ── Web manifest ──────────────────────────────────────────────── */}
        <link rel="manifest" href="/icons/site.webmanifest" />
      </head>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          min-h-screen flex flex-col
          bg-gray-50 dark:bg-gray-950
          text-gray-900 dark:text-gray-100
          antialiased
        `}
      >
        <Navbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}