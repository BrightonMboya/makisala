'use client'

import { Children, useState, useRef, useCallback, useEffect, type ReactNode } from 'react'

interface V2CarouselProps {
  children: ReactNode
}

export function V2Carousel({ children }: V2CarouselProps) {
  const items = Children.toArray(children)
  const [current, setCurrent] = useState(0)
  const [showArrows, setShowArrows] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const totalItems = items.length

  // On desktop we show 3, on mobile 1
  const getVisibleCount = useCallback(() => {
    if (typeof window === 'undefined') return 3
    if (window.innerWidth < 768) return 1
    return 3
  }, [])

  const [visibleCount, setVisibleCount] = useState(3)

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [getVisibleCount])

  const maxIndex = Math.max(0, totalItems - visibleCount)

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, maxIndex))
      setCurrent(clamped)
    },
    [maxIndex]
  )

  const prev = () => goTo(current - 1)
  const next = () => goTo(current + 1)

  // Calculate transform percentage
  const slideWidth = 100 / visibleCount
  const gapCompensation = visibleCount === 1 ? 0 : 20 * (current / visibleCount)
  const translateX = -(current * slideWidth)

  const dotCount = maxIndex + 1

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <div className="overflow-hidden" ref={scrollRef}>
        <div
          className="flex transition-transform duration-500 ease-in-out gap-5"
          style={{
            transform: `translateX(calc(${translateX}% - ${gapCompensation}px))`,
          }}
        >
          {items.map((child, i) => (
            <div
              key={i}
              className="flex-shrink-0"
              style={{ width: `calc(${slideWidth}% - ${visibleCount === 1 ? 0 : (20 * (visibleCount - 1)) / visibleCount}px)` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Left arrow */}
      {current > 0 && (
        <button
          onClick={prev}
          className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center transition-opacity duration-200 hover:bg-white ${showArrows ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Previous"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3A3A3C" strokeWidth="1.5">
            <polyline points="10,2 4,8 10,14" />
          </svg>
        </button>
      )}

      {/* Right arrow */}
      {current < maxIndex && (
        <button
          onClick={next}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center transition-opacity duration-200 hover:bg-white ${showArrows ? 'opacity-100' : 'opacity-0'}`}
          aria-label="Next"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#3A3A3C" strokeWidth="1.5">
            <polyline points="6,2 12,8 6,14" />
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      {dotCount > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${i === current ? 'bg-[#3A3A3C]' : 'bg-gray-300'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
