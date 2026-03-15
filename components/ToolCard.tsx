import Link from "next/link"

type Props = {
  title: string
  description: string
  icon: string
  link: string
  isNew?: boolean
}

export default function ToolCard({ title, description, icon, link, isNew }: Props) {
  return (
    <Link href={link} className="group block">
      <div
        className="
          relative h-full
          border border-gray-200 dark:border-gray-800
          rounded-xl p-5
          bg-white dark:bg-gray-900
          hover:border-violet-300 dark:hover:border-violet-700
          hover:shadow-md hover:shadow-violet-100 dark:hover:shadow-violet-900/20
          transition-all duration-200
        "
      >

        {/* New badge */}
        {isNew && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
            NEW
          </span>
        )}

        {/* Icon */}
        <div className="
          w-10 h-10 mb-4 rounded-lg
          flex items-center justify-center
          bg-gray-100 dark:bg-gray-800
          text-gray-700 dark:text-gray-300
          font-mono font-bold text-sm
          group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30
          group-hover:text-violet-700 dark:group-hover:text-violet-400
          transition-colors duration-200
        ">
          {icon}
        </div>

        {/* Text */}
        <h2 className="
          font-semibold text-sm text-gray-900 dark:text-white
          group-hover:text-violet-700 dark:group-hover:text-violet-400
          transition-colors duration-200 mb-1
        ">
          {title}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Arrow */}
        <div className="
          mt-4 flex items-center gap-1
          text-xs font-medium text-gray-400 dark:text-gray-600
          group-hover:text-violet-600 dark:group-hover:text-violet-400
          transition-colors duration-200
        ">
          Open tool
          <span className="translate-x-0 group-hover:translate-x-0.5 transition-transform duration-200">
            →
          </span>
        </div>

      </div>
    </Link>
  )
}