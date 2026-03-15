export default function Loading() {
  return (
    <div className="tool-page space-y-6">

      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="shimmer w-9 h-9 rounded-lg" />
          <div className="shimmer h-7 w-48 rounded-lg" />
        </div>
        <div className="shimmer h-4 w-72 rounded-lg" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center gap-3">
        <div className="shimmer h-8 w-32 rounded-lg" />
        <div className="shimmer h-8 w-32 rounded-lg" />
        <div className="flex-1" />
        <div className="shimmer h-8 w-20 rounded-lg" />
      </div>

      {/* Editor skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="shimmer h-4 w-16 rounded-lg" />
          <div className="shimmer h-48 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <div className="shimmer h-4 w-16 rounded-lg" />
          <div className="shimmer h-48 w-full rounded-xl" />
        </div>
      </div>

      {/* Button skeleton */}
      <div className="shimmer h-10 w-full rounded-xl" />

    </div>
  )
}