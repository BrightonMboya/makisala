'use client'

import { useState } from 'react'

const navItems = [
  { label: 'Overview', href: '#overview' },
  { label: 'Experience Designer', href: '#trip-designer' },
  { label: 'Trip Inspiration', href: '#inspiration' },
  { label: 'Featured Stays', href: '#stays' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'Process', href: '#process' },
  { label: 'Good To Know', href: '#good-to-know' },
  { label: 'Discover Further', href: '#discover' },
]

export function V2SidebarNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-[#F9F7F4] border border-gray-200"
          aria-label="Toggle navigation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="#3A3A3C"
            strokeWidth="1.5"
          >
            {mobileOpen ? (
              <>
                <line x1="4" y1="4" x2="16" y2="16" />
                <line x1="16" y1="4" x2="4" y2="16" />
              </>
            ) : (
              <>
                <line x1="3" y1="5" x2="17" y2="5" />
                <line x1="3" y1="10" x2="17" y2="10" />
                <line x1="3" y1="15" x2="17" y2="15" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-[#F9F7F4] z-40
          lg:sticky lg:top-[100px] lg:h-[calc(100vh-120px)] lg:block
          fixed top-0 left-0 h-full w-64
          transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="flex flex-col py-8 px-6">
          <div>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="group block py-2 text-[14px] text-foreground tracking-wide"
                  >
                    <span className="relative">
                      {item.label}
                      <span className="absolute left-0 -bottom-0.5 w-full h-[1px] bg-foreground origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <a
              href="#start-planning"
              className="mt-4 bg-primary text-primary-foreground text-center text-[13.5px] font-medium tracking-wide px-5 py-[9px] h-[45px] flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              Start Planning
            </a>
          </div>
        </nav>
      </aside>
    </>
  )
}
