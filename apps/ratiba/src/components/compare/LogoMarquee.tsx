'use client'

const trustedLogos = [
  { name: 'Nomad Tanzania', src: '/logos/nomad.svg', width: 128 },
  { name: 'Lemala Camps & Lodges', src: '/logos/lemala.svg', width: 156, invert: true },
  { name: 'Asilia Africa', src: '/logos/asilia.svg', width: 132 },
  { name: 'Elewana Collection', src: '/logos/elewana.png', width: 136, invert: true },
]

export function LogoMarquee() {
  return (
    <div className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white to-transparent" />
      <div className="animate-marquee flex w-max gap-6">
        {[...Array(3)].map((_, setIndex) =>
          trustedLogos.map((logo) => (
            <div
              key={`${setIndex}-${logo.name}`}
              className="flex h-12 w-[188px] shrink-0 items-center justify-center"
            >
              <img
                src={logo.src}
                alt={logo.name}
                className="max-h-[30px] object-contain opacity-[0.72]"
                style={{
                  width: `${logo.width}px`,
                  filter: logo.invert ? 'brightness(0) saturate(100%)' : 'none',
                }}
              />
            </div>
          )),
        )}
      </div>
    </div>
  )
}
