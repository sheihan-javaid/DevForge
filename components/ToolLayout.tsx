// import type { Metadata } from "next"
// import Link from "next/link"
// import { getToolBySlug, tools } from "@/data/tools"
// import type { Tool } from "@/data/tools"

// // ── Types ─────────────────────────────────────────────────────────────────────

// type Props = {
//   slug:     string
//   children: React.ReactNode
// }

// // ── Metadata generator ────────────────────────────────────────────────────────

// export function generateToolMetadata(slug: string): Metadata {
//   const tool = getToolBySlug(slug)
//   if (!tool) return { title: "Tool | DevForge" }

//   return {
//     title:       tool.name,
//     description: tool.description,
//     openGraph: {
//       title:       `${tool.name} | DevForge`,
//       description: tool.description,
//       type:        "website",
//     },
//   }
// }

// // ── Related tools ─────────────────────────────────────────────────────────────

// function getRelatedTools(current: Tool): Tool[] {
//   return tools
//     .filter((t) => t.slug !== current.slug && t.category === current.category)
//     .slice(0, 3)
// }

// // ── Breadcrumb ────────────────────────────────────────────────────────────────

// function Breadcrumb({ tool }: { tool: Tool }) {
//   return (
//     <nav className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 mb-6">
//       <Link
//         href="/"
//         className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors no-underline"
//       >
//         Home
//       </Link>
//       <span>/</span>
//       <Link
//         href="/#tools"
//         className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors no-underline"
//       >
//         Tools
//       </Link>
//       <span>/</span>
//       <span className="text-gray-600 dark:text-gray-400 font-medium">
//         {tool.name}
//       </span>
//     </nav>
//   )
// }

// // ── Related tools strip ───────────────────────────────────────────────────────

// function RelatedTools({ tools }: { tools: Tool[] }) {
//   if (tools.length === 0) return null

//   return (
//     <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 space-y-4">
//       <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
//         Related tools
//       </h2>
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//         {tools.map((tool) => (
//           <Link
//             key={tool.slug}
//             href={`/tools/${tool.slug}`}
//             className="
//               group flex items-start gap-3 p-4
//               card rounded-xl no-underline
//               hover:border-violet-300 dark:hover:border-violet-700
//               hover:shadow-sm transition-all duration-150
//             "
//           >
//             <span className="
//               flex items-center justify-center
//               w-8 h-8 rounded-lg shrink-0
//               bg-gray-100 dark:bg-gray-800
//               text-gray-600 dark:text-gray-400
//               font-mono font-bold text-xs
//               group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30
//               group-hover:text-violet-700 dark:group-hover:text-violet-400
//               transition-colors
//             ">
//               {tool.icon}
//             </span>
//             <div className="min-w-0 space-y-0.5">
//               <p className="
//                 text-sm font-medium text-gray-900 dark:text-white
//                 group-hover:text-violet-700 dark:group-hover:text-violet-400
//                 transition-colors
//               ">
//                 {tool.name}
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
//                 {tool.description}
//               </p>
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   )
// }

// // ── Main layout ───────────────────────────────────────────────────────────────

// export default function ToolLayout({ slug, children }: Props) {
//   const tool    = getToolBySlug(slug)
//   const related = tool ? getRelatedTools(tool) : []

//   return (
//     <div className="w-full">
//       {tool && <Breadcrumb tool={tool} />}

//       {/* Tool content */}
//       <div className="w-full">
//         {children}
//       </div>

//       {/* Related tools */}
//       {tool && <RelatedTools tools={related} />}
//     </div>
//   )
// }