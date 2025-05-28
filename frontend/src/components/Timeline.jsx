import React from 'react'
import { CalendarDays } from 'lucide-react'

export default function Timeline({ items = [], onSelect }) {
  if (!items.length) {
    return (
      <p className="text-lg text-gray-500 dark:text-gray-400 mt-2">
        No past visits
      </p>
    )
  }

  return (
    <div className="relative mt-2">
      <ol className="relative border-s border-gray-300 dark:border-gray-600 ml-6 pl-6">
        {items.map((item) => (
          <li key={item.id} className="mb-10 relative">
            {/* Icon positioned on the timeline line with proper spacing */}
            <span className="absolute -left-[2.5rem] top-1.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
              <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </span>

            {/* Visit Details */}
            <div
              onClick={() => onSelect?.(item)}
              className="cursor-pointer shadow-md group text-left bg-gray-50 py-2 px-4 rounded-xl hover:bg-gray-100"
            >
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {item.reason || 'Visit'}
              </h3>
              <time className="block text-sm font-light text-gray-500 dark:text-gray-400 mb-1">
                {new Date(item.timestamp).toLocaleDateString()} –{' '}
                {new Date(item.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
