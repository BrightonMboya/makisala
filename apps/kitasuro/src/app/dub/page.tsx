/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { FeatureTabs } from "./FeatureTabs";
import { ApiTabs } from "./ApiTabs";
import { ProductTabs } from "./ProductTabs";

export default function DubClonePage() {
  return (
    <div className="dub-page min-h-screen bg-white !overflow-x-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .dub-page {
          --font-satoshi: "Inter", system-ui, sans-serif;
          --font-inter: "Inter", system-ui, sans-serif;
          --font-geist-mono: ui-monospace, monospace;
          font-family: var(--font-inter), system-ui, sans-serif;
        }
        .dub-page .font-display {
          font-family: var(--font-satoshi), system-ui, sans-serif;
        }
        .dub-page .font-mono {
          font-family: var(--font-geist-mono), ui-monospace, monospace;
        }
        .border-grid-border {
          border-color: rgb(229 229 229);
        }
        .max-w-grid-width {
          max-width: 1080px;
        }
        @keyframes dub-slide-up-fade {
          0% { opacity: 0; transform: translateY(var(--offset, 2px)); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes dub-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .dub-page .anim-slide-up {
          animation: dub-slide-up-fade 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: both;
          animation-duration: 1s;
        }
        .dub-page .grid-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .dub-page .grid-svg rect {
          fill: url(#dub-grid);
        }
        .dub-page .grid-svg line {
          stroke: rgb(229 229 229);
          stroke-width: 1;
        }
        .logo-flipper {
          perspective: 600px;
        }
        .logo-flipper img {
          transition: opacity 0.3s;
        }
      `,
        }}
      />

      <div className="relative z-10 bg-white">
        {/* Mobile menu button - hidden on desktop */}
        <div className="fixed right-0 top-0 z-40 flex items-center gap-4 p-2.5 lg:hidden">
          <Link
            href="/sign-up"
            className="rounded-lg border border-black bg-black px-3 py-1.5 text-sm font-medium text-white"
          >
            Sign Up
          </Link>
        </div>

        {/* Sticky Nav */}
        <div className="sticky inset-x-0 top-0 z-30 w-full transition-all">
          <div className="absolute inset-0 block border-b border-transparent transition-all" />
          <div className="relative mx-auto w-full max-w-screen-lg px-3 lg:px-4 xl:px-0">
            <div className="flex h-14 items-center justify-between">
              {/* Logo */}
              <div className="grow basis-0">
                <Link href="/dub" className="block w-fit py-2 pr-2">
                  <div className="max-w-fit">
                    <svg
                      width="46"
                      height="24"
                      viewBox="0 0 46 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-auto text-black"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M11 2H14V13.9332L14.0003 13.9731L14.0003 14C14.0003 14.0223 14.0002 14.0445 14 14.0668V21H11V19.7455C9.86619 20.5362 8.48733 21 7.00016 21C3.13408 21 0 17.866 0 14C0 10.134 3.13408 7 7.00016 7C8.48733 7 9.86619 7.46375 11 8.25452V2ZM7 17.9998C9.20914 17.9998 11 16.209 11 13.9999C11 11.7908 9.20914 10 7 10C4.79086 10 3 11.7908 3 13.9999C3 16.209 4.79086 17.9998 7 17.9998ZM32 2H35V8.25474C36.1339 7.46383 37.5128 7 39.0002 7C42.8662 7 46.0003 10.134 46.0003 14C46.0003 17.866 42.8662 21 39.0002 21C35.1341 21 32 17.866 32 14V2ZM39 17.9998C41.2091 17.9998 43 16.209 43 13.9999C43 11.7908 41.2091 10 39 10C36.7909 10 35 11.7908 35 13.9999C35 16.209 36.7909 17.9998 39 17.9998ZM19 7H16V14C16 14.9192 16.1811 15.8295 16.5329 16.6788C16.8846 17.5281 17.4003 18.2997 18.0503 18.9497C18.7003 19.5997 19.472 20.1154 20.3213 20.4671C21.1706 20.8189 22.0809 21 23.0002 21C23.9194 21 24.8297 20.8189 25.679 20.4671C26.5283 20.1154 27.3 19.5997 27.95 18.9497C28.6 18.2997 29.1157 17.5281 29.4675 16.6788C29.8192 15.8295 30.0003 14.9192 30.0003 14H30V7H27V14C27 15.0608 26.5785 16.0782 25.8284 16.8283C25.0783 17.5784 24.0609 17.9998 23 17.9998C21.9391 17.9998 20.9217 17.5784 20.1716 16.8283C19.4215 16.0782 19 15.0608 19 14V7Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </Link>
              </div>

              {/* Desktop Nav */}
              <nav className="relative hidden lg:block">
                <ul className="relative z-0 flex">
                  {["Product", "Solutions", "Resources"].map((item) => (
                    <li key={item}>
                      <button className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900">
                        {item}
                        <svg
                          width="9"
                          height="9"
                          fill="none"
                          viewBox="0 0 9 9"
                          className="ml-1.5 size-2.5 text-neutral-700"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M7.278 3.389 4.5 6.167 1.722 3.389"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                  <li>
                    <Link
                      href="#"
                      className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900"
                    >
                      Enterprise
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#customers"
                      className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900"
                    >
                      Customers
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="#pricing"
                      className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-900/5 hover:text-neutral-900"
                    >
                      Pricing
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* Right side */}
              <div className="hidden grow basis-0 justify-end gap-2 min-[281px]:flex">
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="rounded-lg border border-black bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ========== HERO ========== */}
        <div className="grid-section relative overflow-clip border-y border-grid-border px-4">
          <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border">
            {/* Grid background */}
            <div className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(transparent,black)]">
              <GridSVG id="hero" />
            </div>

            <div className="relative py-20 sm:py-28">
              <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center px-4 text-center">
                {/* Badge */}
                <a
                  href="#"
                  className="anim-slide-up group flex divide-neutral-300 rounded-full border border-neutral-300 bg-white text-xs font-medium drop-shadow-sm transition-colors duration-75 hover:bg-neutral-50 sm:divide-x"
                  style={
                    {
                      "--offset": "10px",
                      animationDelay: "0ms",
                    } as React.CSSProperties
                  }
                >
                  <span className="py-1.5 pl-4 text-neutral-800 sm:pr-2.5">
                    Celebrating $10M partner payouts on Dub
                  </span>
                  <span className="flex items-center gap-1.5 p-1.5 pl-2.5 text-neutral-500">
                    <span className="hidden sm:block">Read more</span>
                    <span className="rounded-full bg-neutral-100 p-0.5">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-2.5 transition-transform duration-100 group-hover:-translate-y-px group-hover:translate-x-px"
                      >
                        <path d="M7 7h10v10" />
                        <path d="M7 17 17 7" />
                      </svg>
                    </span>
                  </span>
                </a>

                {/* Heading */}
                <h1
                  className="anim-slide-up mt-5 text-pretty text-center font-display text-4xl font-medium text-neutral-900 sm:text-5xl sm:leading-[1.15]"
                  style={
                    {
                      "--offset": "20px",
                      animationDelay: "100ms",
                    } as React.CSSProperties
                  }
                >
                  Turn clicks into revenue
                </h1>

                {/* Subheading */}
                <p
                  className="anim-slide-up mt-5 text-pretty text-base text-neutral-600 sm:text-xl"
                  style={
                    {
                      "--offset": "10px",
                      animationDelay: "200ms",
                    } as React.CSSProperties
                  }
                >
                  Dub is the modern link attribution platform for short links,
                  conversion tracking, and affiliate programs.
                </p>
              </div>

              {/* CTA Buttons */}
              <div
                className="anim-slide-up relative mx-auto mt-10 flex max-w-fit space-x-4"
                style={
                  {
                    "--offset": "5px",
                    animationDelay: "300ms",
                  } as React.CSSProperties
                }
              >
                <Link
                  href="/sign-up"
                  className="mx-auto max-w-fit rounded-lg border border-black bg-black px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-neutral-800 hover:ring-4 hover:ring-neutral-200"
                >
                  Start for free
                </Link>
                <Link
                  href="#"
                  className="mx-auto max-w-fit rounded-lg border border-neutral-200 bg-white px-5 py-2 text-sm font-medium text-neutral-500 shadow-sm transition-all hover:border-neutral-400 hover:text-neutral-800 hover:ring-4 hover:ring-neutral-200"
                >
                  Get a demo
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ========== LOGO CLOUD ========== */}
        <div className="grid-section relative overflow-clip border-y border-grid-border bg-neutral-100 px-4 [.grid-section~&]:border-t-0">
          <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 px-4 py-10 opacity-60 grayscale sm:px-10">
              {[
                { name: "Twilio", src: "https://assets.dub.co/companies/twilio.svg" },
                { name: "Raycast", src: "https://assets.dub.co/companies/raycast.svg" },
                { name: "Cal.com", src: "https://assets.dub.co/companies/cal.svg" },
                { name: "Superhuman", src: "https://assets.dub.co/companies/superhuman.svg" },
                { name: "Framer", src: "https://assets.dub.co/companies/framer.svg" },
                { name: "Perplexity", src: "https://assets.dub.co/companies/perplexity.svg" },
                { name: "Product Hunt", src: "https://assets.dub.co/companies/product-hunt.svg" },
                { name: "Vercel", src: "https://assets.dub.co/companies/vercel.svg" },
                { name: "Buffer", src: "https://assets.dub.co/companies/buffer.svg" },
                { name: "Clerk", src: "https://assets.dub.co/companies/clerk.svg" },
                { name: "Whop", src: "https://assets.dub.co/companies/whop.svg" },
                { name: "Supabase", src: "https://assets.dub.co/companies/supabase.svg" },
              ].map((c) => (
                <img
                  key={c.name}
                  alt={c.name}
                  src={c.src}
                  className="h-6 w-auto sm:h-7"
                  loading="lazy"
                />
              ))}
            </div>
          </div>
        </div>

        {/* ========== PRODUCT TABS ========== */}
        <div className="grid-section relative overflow-clip border-y border-grid-border bg-neutral-100 px-4 [.grid-section~&]:border-t-0">
          <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border">
            <ProductTabs />
          </div>
        </div>

        {/* ========== MANIFESTO ========== */}
        <div className="grid-section relative overflow-clip border-y border-grid-border px-4 [.grid-section~&]:border-t-0">
          <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border px-4 pb-16 pt-32 sm:pb-32 sm:pt-40">
            <div className="relative mx-auto max-w-[530px] bg-white">
              <div className="space-y-8 text-3xl leading-snug text-neutral-800">
                <p>
                  Marketing isn&apos;t just about clicks.
                  <br />
                  It&apos;s about outcomes.
                </p>
                <p>
                  Dub is the modern link attribution platform that unifies short
                  links, real-time analytics, and affiliate programs &ndash; all
                  in one place. It&apos;s fast. It&apos;s reliable. It&apos;s
                  beautiful. And it scales with you.
                </p>
                <p>
                  Because you deserve more than vanity metrics. You deserve
                  clarity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========== DUB LINKS ========== */}
        <FeatureSection
          id="links"
          color="orange"
          icon={
            <svg width="11" height="10" fill="none" viewBox="0 0 11 10" className="size-2.5">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="3.333" d="M5.5 5.667v-4M5.5 5.667l-3.333 2M5.5 5.667l3.333 2" />
            </svg>
          }
          label="Dub Links"
          title="It starts with a link"
          description="Create branded short links with superpowers: built-in QR codes, device/geo-targeting, A/B testing, deep links, and more."
          ctaText="Explore Links"
          ctaHref="/links"
          testimonial={{
            quote:
              "What you all have built is fantastic. I've used platforms like Bitly for years, and Dub is hands down the best.",
            name: "Ian Mackey",
            title: "Vice President at Scicomm Media",
            avatar: "https://assets.dub.co/testimonials/people/ian-mackey.jpeg",
          }}
          subFeatures={[
            {
              icon: <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4"><g fill="currentColor"><ellipse cx="9" cy="9" fill="none" rx="7.25" ry="3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><ellipse cx="9" cy="9" fill="none" rx="3" ry="7.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><circle cx="9" cy="9" fill="none" r="7.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></g></svg>,
              name: "Custom domains",
              description: "Boost click-through rates by 30% with custom domains that match your brand.",
              href: "#",
              screenshot: "https://assets.dub.co/home/features/link-builder-mini.jpg",
              screenshotAlt: "Link builder with custom domains",
            },
            {
              icon: <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4"><g fill="currentColor"><path d="M7.408,2.25h5.342c1.381,0,2.5,1.119,2.5,2.5h0c0,1.381-1.119,2.5-2.5,2.5H7.408" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d="M10.591,15.75H5.25c-1.381,0-2.5-1.119-2.5-2.5h0c0-1.381,1.119-2.5,2.5-2.5h5.344" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><circle cx="5.75" cy="4.75" fill="none" r="3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><circle cx="12.25" cy="13.25" fill="none" r="3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></g></svg>,
              name: "Advanced link features",
              description: "Custom link previews, device/geo-targeting, A/B testing, deep links, and more.",
              href: "#",
              screenshot: "https://assets.dub.co/home/features/link-builder-mini.jpg",
              screenshotAlt: "Advanced link features interface",
            },
            {
              icon: <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4"><g fill="currentColor"><rect x="2.75" y="2.75" width="12.5" height="12.5" rx="1.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><rect x="5.25" y="5.25" width="3" height="3" fill="currentColor" /><rect x="9.75" y="5.25" width="3" height="3" fill="currentColor" /><rect x="5.25" y="9.75" width="3" height="3" fill="currentColor" /><rect x="9.75" y="9.75" width="3" height="3" fill="currentColor" /></g></svg>,
              name: "QR codes",
              description: "Generate beautiful, customizable QR codes for your short links.",
              href: "#",
              screenshot: "https://assets.dub.co/home/features/qr-demo.png",
              screenshotAlt: "QR code generator",
            },
          ]}
        />

        {/* ========== DUB ANALYTICS ========== */}
        <FeatureSection
          id="analytics"
          color="green"
          icon={
            <svg width="10" height="10" fill="none" viewBox="0 0 10 10" className="size-2.5">
              <path stroke="currentColor" strokeLinecap="round" strokeWidth="3.333" d="M2.333 6.333v2M7.667 1.667v6.666" />
            </svg>
          }
          label="Dub Analytics"
          title="Measure what matters"
          description="From first click to conversion, understand exactly how your marketing drives revenue with Dub's powerful attribution engine."
          ctaText="Explore Analytics"
          ctaHref="/analytics"
          testimonial={{
            quote:
              "Dub has been a game-changer for our marketing campaigns. Our links get tens of millions of clicks monthly \u2013 with Dub, we are able to easily design our link previews, attribute clicks, and visualize our data.",
            name: "Johnny Ho",
            title: "Co-founder at Perplexity",
            avatar: "https://assets.dub.co/testimonials/people/johnny-ho.jpeg",
          }}
          subFeatures={[
            {
              icon: <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4"><g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor"><line x1="11.75" x2="12.25" y1="11.25" y2="11.25" /><line x1="11.75" x2="12.25" y1="8.25" y2="8.25" /><polyline points="14.75 5.75 14.75 16.25 12 14.75 9 16.25 6 14.75 3.25 16.25 3.25 5.75" /></g></svg>,
              name: "Conversion tracking",
              description: "Track your customer journey from first click to final sale.",
              href: "#",
              screenshot: "https://assets.dub.co/home/features/funnel-chart-mini.png",
              screenshotAlt: "Conversion funnel chart",
            },
            {
              icon: <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4"><g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor"><path d="M2.75 10.75L6.396 7.10401C6.591 6.90901 6.908 6.90901 7.103 7.10401L10.396 10.397C10.591 10.592 10.908 10.592 11.103 10.397L15.249 6.25101" /><path d="M2.75 2.75V12.75C2.75 13.855 3.645 14.75 4.75 14.75H15.25" /></g></svg>,
              name: "Real-time analytics",
              description: "See clicks, leads, and sales in real-time with full detail.",
              href: "#",
              screenshot: "https://assets.dub.co/home/features/example-sweatshirt.png",
              screenshotAlt: "Real-time analytics dashboard",
            },
            {
              icon: <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4"><g fill="currentColor"><circle cx="9" cy="6.5" fill="none" r="2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d="M5.402,13.25c.649-1.332,2.016-2.25,3.598-2.25s2.949,.918,3.598,2.25" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d="M15.75,11.75v2c0,1.105-.895,2-2,2h-2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d="M6.25,15.75h-2c-1.105,0-2-.895-2-2v-2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d="M2.25,6.25v-2c0-1.105,.895-2,2-2h2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d="M11.75,2.25h2c1.105,0,2,.895,2,2v2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /></g></svg>,
              name: "Customer insights",
              description: "Understand customer journey, LTV, and retention rates.",
              href: "#",
              screenshot: "https://assets.dub.co/analytics/emily.jpg",
              screenshotAlt: "Customer insights view",
            },
          ]}
        />

        {/* ========== DUB PARTNERS ========== */}
        <FeatureSection
          id="partners"
          color="purple"
          icon={
            <svg width="32" height="32" fill="none" viewBox="0 0 32 32" className="size-2.5">
              <circle cx="27" cy="16" r="5" fill="currentColor" />
              <circle cx="5" cy="16" r="5" fill="currentColor" />
              <circle cx="16" cy="27" r="5" fill="currentColor" />
              <circle cx="16" cy="5" r="5" fill="currentColor" />
            </svg>
          }
          label="Dub Partners"
          title="Grow with partnerships"
          description="Build powerful, embedded referral/affiliate programs to boost product-led growth and increase revenue."
          ctaText="Explore Partners"
          ctaHref="/partners"
          testimonial={{
            quote:
              "Dub is the ultimate partner infrastructure for every startup. If you're looking to 10x your community / product-led growth \u2013 I cannot recommend building a partner program with Dub enough.",
            name: "Koen Bok",
            title: "CEO at Framer",
            avatar: "https://assets.dub.co/testimonials/people/koen-bok.jpg",
          }}
          subFeatures={[
            {
              icon: <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4"><g fill="currentColor"><circle cx="9" cy="9" fill="none" r="7.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><path d="M10.817,6.951c-.394-.933-1.183-1.144-1.779-1.144-.554,0-2.01,.295-1.875,1.692,.094,.981,1.019,1.346,1.827,1.49s1.981,.452,2.01,1.635c.024,1-.875,1.683-1.962,1.683-1.038,0-1.76-.404-2.038-1.317" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" /><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" x1="9" x2="9" y1="4.75" y2="5.807" /><line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" x1="9" x2="9" y1="12.193" y2="13.25" /></g></svg>,
              name: "Commission structures",
              description: "Flexible percentage or flat-fee commissions with customizable durations.",
              href: "#",
              screenshot: "https://assets.dub.co/home/features/embed-demo.jpg",
              screenshotAlt: "Partner commission structures",
            },
            {
              icon: <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4"><g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor"><rect x="2.75" y="2.75" width="12.5" height="12.5" rx="2" /><path d="M6.75,10.25v-2.5c0-.552,.448-1,1-1h2.5c.552,0,1,.448,1,1v2.5c0,.552-.448,1-1,1h-2.5c-.552,0-1-.448-1-1Z" /><line x1="6.75" x2="2.75" y1="7.75" y2="7.75" /><line x1="15.25" x2="11.25" y1="7.75" y2="7.75" /></g></svg>,
              name: "Embeddable widgets",
              description: "White-labeled partner portals and embeddable referral widgets.",
              href: "#",
              screenshot: "https://assets.dub.co/home/features/embed-demo.jpg",
              screenshotAlt: "Embeddable referral widgets",
            },
            {
              icon: <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4"><g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor"><path d="M9.75,15.25h-5c-1.105,0-2-.895-2-2V4.75c0-1.105,.895-2,2-2h4.586c.265,0,.52,.105,.707,.293l3.914,3.914c.188,.188,.293,.442,.293,.707v1.586" /><polyline points="9.75 2.75 9.75 6.25 13.25 6.25" /><path d="M11.25,14l1.5,1.5,3-3" /></g></svg>,
              name: "Automated payouts",
              description: "Automatic partner payouts via PayPal, bank transfer, or crypto.",
              href: "#",
              screenshot: "https://assets.dub.co/home/features/embed-demo.jpg",
              screenshotAlt: "Automated partner payouts",
            },
          ]}
        />

        {/* ========== BUILT TO SCALE ========== */}
        <div className="grid-section relative overflow-clip border-y border-grid-border bg-neutral-50 px-4 [.grid-section~&]:border-t-0">
          <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border py-24 sm:border-r-0">
            <div className="relative mx-auto flex w-full max-w-screen-lg flex-col px-4 md:flex-row md:gap-10 md:pl-8 lg:gap-20 lg:pl-12">
              <div className="relative z-10 flex flex-col justify-between gap-10 text-center md:max-w-[304px] md:gap-8 md:py-12 md:text-left">
                <div className="-mt-4 md:mt-0">
                  <h2 className="font-display text-3xl font-medium text-neutral-900 sm:text-4xl">
                    Built to scale
                  </h2>
                  <p className="mt-2 text-pretty text-lg text-neutral-500">
                    Our powerful, battle-tested infrastructure handles hundreds
                    of millions of links &amp; events monthly and can scale
                    infinitely with your business needs.
                  </p>
                </div>
                <div className="flex flex-col gap-8">
                  {[
                    { label: "Links Created", value: "1,234,567,890" },
                    { label: "Events Tracked", value: "5,678,901,234" },
                    { label: "Revenue Tracked", value: "$10,234,567" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex flex-col items-center justify-center space-y-2 md:items-start"
                    >
                      <span className="text-sm uppercase text-neutral-500">
                        {stat.label}
                      </span>
                      <p className="font-mono text-2xl font-medium text-orange-600">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== DUB API ========== */}
        <div className="grid-section relative overflow-clip border-y border-grid-border px-4 [.grid-section~&]:border-t-0">
          <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border pb-10 pt-10 sm:pt-20">
            <div className="flex flex-col px-4 sm:px-10">
              <div className="flex items-center gap-2">
                <span className="flex size-4 items-center justify-center rounded border border-black/5 bg-neutral-400 text-neutral-900">
                  <svg width="12" height="12" fill="none" viewBox="0 0 12 12" className="size-2.5">
                    <path fill="currentColor" d="M7.311 2.624a1.126 1.126 0 0 1 1.506-.077l.086.077 1.519 1.52.18.199a2.626 2.626 0 0 1-.18 3.514L8.903 9.375l-.086.078a1.126 1.126 0 0 1-1.506-1.669l1.52-1.52.048-.058a.38.38 0 0 0 0-.412l-.048-.06-1.52-1.518-.077-.086a1.126 1.126 0 0 1 .077-1.506M3.183 2.547A1.126 1.126 0 0 1 4.766 4.13l-.078.086-1.52 1.519a.375.375 0 0 0 0 .53l1.52 1.52.078.085a1.125 1.125 0 0 1-1.583 1.583l-.086-.078-1.519-1.518a2.626 2.626 0 0 1 0-3.713l1.519-1.52z" />
                  </svg>
                </span>
                <span className="text-xs font-medium text-neutral-600">
                  Dub API
                </span>
              </div>
              <h2 className="mt-3 max-w-lg text-pretty font-display text-3xl font-medium text-neutral-900 sm:text-4xl md:text-5xl">
                Enterprise-grade link infrastructure
              </h2>
              <p className="mt-3 max-w-xl text-pretty text-base text-neutral-500 sm:text-lg">
                Programmatically generate millions of short links, with deferred
                deep linking and real-time webhooks built in.
              </p>
              <div className="mt-8">
                <Link
                  href="#"
                  className="mx-[unset] flex max-w-fit rounded-lg border border-neutral-200 bg-white px-5 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-all hover:border-neutral-400 hover:text-neutral-800 hover:ring-4 hover:ring-neutral-200"
                >
                  Explore API
                </Link>
              </div>
            </div>

            {/* Code block + interactive API sub-features */}
            <ApiTabs
              subFeatures={[
                { name: "Real-time webhooks", description: "Get notified instantly when links are clicked or conversions happen.", href: "#" },
                { name: "Deferred deep links", description: "Route users to the right content even after app install.", href: "#" },
                { name: "Multi-language SDKs", description: "TypeScript, Go, Python, Ruby, and PHP SDKs available.", href: "#" },
              ]}
            >
              <div className="mt-10 border-y border-grid-border bg-neutral-50 sm:mt-20">
                <div className="flex flex-col">
                  <div className="flex grow items-center justify-center overflow-hidden px-4 py-10 sm:h-[440px] sm:px-8">
                    <div className="w-full max-w-xl overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl">
                      <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
                        <div className="flex gap-1.5">
                          <div className="h-3 w-3 rounded-full bg-neutral-700" />
                          <div className="h-3 w-3 rounded-full bg-neutral-700" />
                          <div className="h-3 w-3 rounded-full bg-neutral-700" />
                        </div>
                        <span className="ml-2 text-xs text-neutral-500">
                          index.ts
                        </span>
                      </div>
                      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                        <code>
                          <span className="text-violet-400">import</span>
                          <span className="text-neutral-300">{" { "}</span>
                          <span className="text-emerald-400">Dub</span>
                          <span className="text-neutral-300">{" } "}</span>
                          <span className="text-violet-400">from</span>
                          <span className="text-amber-300">
                            {' "dub"'}
                          </span>
                          <span className="text-neutral-300">;</span>
                          {"\n\n"}
                          <span className="text-violet-400">const</span>
                          <span className="text-neutral-300"> dub = </span>
                          <span className="text-violet-400">new</span>
                          <span className="text-emerald-400"> Dub</span>
                          <span className="text-neutral-300">();</span>
                          {"\n\n"}
                          <span className="text-violet-400">const</span>
                          <span className="text-neutral-300"> link = </span>
                          <span className="text-violet-400">await</span>
                          <span className="text-neutral-300">
                            {" dub.links.create({"}
                          </span>
                          {"\n"}
                          <span className="text-neutral-300">{"  url: "}</span>
                          <span className="text-amber-300">
                            {'"https://example.com"'}
                          </span>
                          <span className="text-neutral-300">,</span>
                          {"\n"}
                          <span className="text-neutral-300">{"}"});</span>
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </ApiTabs>

            {/* API testimonial */}
            <div className="px-4 pb-10 pt-4 sm:px-10">
              <TestimonialInline
                quote="Dub's link infrastructure is incredibly reliable \u2013 we've been using them in production at Whop for years now, creating thousands of links per month with sub-150ms request latency."
                name="Jack Sharkey"
                title="CTO at Whop"
                avatar="https://assets.dub.co/testimonials/people/jack-sharkey.jpg"
              />
            </div>
          </div>
        </div>

        {/* ========== CUSTOMERS / TESTIMONIALS ========== */}
        <div
          id="customers"
          className="grid-section relative overflow-clip border-y border-grid-border px-4 [.grid-section~&]:border-t-0"
        >
          <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border px-4 py-20 sm:px-10 sm:py-28">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-medium text-neutral-900 sm:text-4xl">
                Trusted by startups and enterprises
              </h2>
              <p className="mt-4 text-base text-neutral-500 sm:text-lg">
                Join 100,000+ customers who use our link attribution platform to
                take their marketing efforts to the next level.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <CustomerCard
                company="Framer"
                logo="https://assets.dub.co/testimonials/companies/vercel.svg"
                quote='Dub is simply put the <strong class="text-neutral-900">best way to track links and measure attribution</strong>. It&apos;s easy, clean, and just works &ndash; while all the alternatives look bloated, complicated, and dated.'
                name="Jorn van Dijk"
                title="CEO, Framer"
                avatar="https://assets.dub.co/testimonials/people/jorn-van-dijk.jpg"
              />
              <CustomerCard
                company="Vercel"
                logo="https://assets.dub.co/testimonials/companies/vercel.svg"
                quote='Stripe for payments, Vercel for deployments, <strong class="text-neutral-900">Dub for links</strong>. As the cloud evolves, we abstract out common needs into reusable, high-performance infrastructure. Excited about Dub filling this foundational missing piece of the puzzle.'
                name="Guillermo Rauch"
                title="CEO, Vercel"
                avatar="https://assets.dub.co/testimonials/people/guillermo-rauch.jpeg"
              />
              <CustomerCard
                company="Clerk"
                logo="https://assets.dub.co/testimonials/companies/clerk.svg"
                quote='<strong class="text-neutral-900">Dub has been a breath of fresh air</strong> in the link management space &ndash; with everything we needed and no unnecessary feature bloat.'
                name="Nick Parsons"
                title="Director of Marketing, Clerk"
                avatar="https://assets.dub.co/testimonials/people/nick-parsons.jpeg"
              />
              <CustomerCard
                company="Cal.com"
                logo="https://assets.dub.co/testimonials/companies/cal.svg"
                quote='We&apos;ve been active users of Dub since day one! Not only is the product immensely useful, <strong class="text-neutral-900">it&apos;s also built with an obsessive focus on UX</strong> &ndash; something that a lot of the incumbents in the space lack.'
                name="Peer Richelsen"
                title="Co-founder, Cal.com"
                avatar="https://assets.dub.co/testimonials/people/peer-richelsen.jpeg"
              />
            </div>
          </div>
        </div>

        {/* ========== WE SHIP FAST ========== */}
        <div className="grid-section relative overflow-clip border-y border-grid-border px-4 [.grid-section~&]:border-t-0">
          <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border px-4 py-20 sm:px-10">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-display text-3xl font-medium text-neutral-900 sm:text-4xl">
                We ship fast
              </h2>
              <p className="mt-2 text-base text-neutral-500 sm:text-lg">
                Always improving, adding features and functionality.
              </p>
            </div>

            <div className="mx-auto max-w-2xl space-y-3">
              {[
                { title: "Advanced analytics filters", date: "Feb 17, 2026" },
                {
                  title: "Support for tracking Stripe free trials",
                  date: "Jan 30, 2026",
                },
                {
                  title: "Better security with new viewer and billing roles",
                  date: "Jan 16, 2026",
                },
                {
                  title: "Celebrating $10 million in partner payouts on Dub",
                  date: "Dec 10, 2025",
                },
                {
                  title: "New partner stats + filtering analytics by group",
                  date: "Nov 18, 2025",
                },
              ].map((update) => (
                <div
                  key={update.title}
                  className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4 transition-colors hover:bg-neutral-50"
                >
                  <span className="text-sm font-medium text-neutral-900">
                    {update.title}
                  </span>
                  <span className="shrink-0 pl-4 text-xs text-neutral-400">
                    {update.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== BOTTOM CTA ========== */}
        <div className="grid-section relative overflow-clip border-y border-grid-border px-4 [.grid-section~&]:border-t-0">
          <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border">
            {/* Dark curved section */}
            <div className="relative bg-neutral-900">
              {/* Top curved connector */}
              <div className="relative flex h-16 max-w-[min(700px,calc(100vw-2rem))] -translate-y-px items-start justify-center text-neutral-100 max-md:mx-auto max-md:h-auto md:text-white">
                <div className="relative z-10 h-[calc(100%+1px)] min-w-0 grow border-current bg-current" />
              </div>

              <div className="relative flex flex-col items-center px-4 pb-32 pt-24 text-center">
                <h2 className="max-w-lg text-balance font-display text-4xl font-medium text-neutral-50 sm:text-5xl">
                  Supercharge your marketing efforts
                </h2>
                <p className="mt-6 max-w-[560px] text-pretty text-lg font-medium text-neutral-400 sm:text-xl">
                  See why Dub is the link attribution platform of choice for
                  modern marketing teams.
                </p>
                <div className="mt-10 flex items-center justify-center gap-3">
                  <Link
                    href="/sign-up"
                    className="flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-white px-5 text-center text-sm font-medium text-neutral-900 ring-white/20 transition-all hover:ring"
                  >
                    Start for free
                  </Link>
                  <Link
                    href="#"
                    className="flex h-10 items-center justify-center rounded-lg border border-transparent bg-white/20 px-5 text-center text-sm font-medium text-white backdrop-blur-sm ring-white/10 transition-all hover:ring"
                  >
                    Get a demo
                  </Link>
                </div>

                {/* Review badges */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-8">
                  {["G2", "Product Hunt", "Trustpilot"].map((platform) => (
                    <div
                      key={platform}
                      className="flex items-center gap-2.5"
                    >
                      <div className="flex items-center text-white/85">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            stroke="currentColor"
                            strokeWidth="0"
                            className="size-4 shrink-0"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                        <span className="ml-2 text-xs text-white/60">
                          {platform}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== FOOTER ========== */}
        <div className="relative z-10 mx-auto w-full max-w-screen-lg overflow-hidden border-neutral-200 px-3 py-16 backdrop-blur-lg lg:px-4 xl:px-0">
          <footer>
            <div className="xl:grid xl:grid-cols-3 xl:gap-8">
              <div className="flex flex-col gap-6">
                <div className="grow">
                  <Link href="/dub" className="block max-w-fit">
                    <svg
                      width="46"
                      height="24"
                      viewBox="0 0 46 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-auto text-neutral-800"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M11 2H14V13.9332L14.0003 13.9731L14.0003 14C14.0003 14.0223 14.0002 14.0445 14 14.0668V21H11V19.7455C9.86619 20.5362 8.48733 21 7.00016 21C3.13408 21 0 17.866 0 14C0 10.134 3.13408 7 7.00016 7C8.48733 7 9.86619 7.46375 11 8.25452V2ZM7 17.9998C9.20914 17.9998 11 16.209 11 13.9999C11 11.7908 9.20914 10 7 10C4.79086 10 3 11.7908 3 13.9999C3 16.209 4.79086 17.9998 7 17.9998ZM32 2H35V8.25474C36.1339 7.46383 37.5128 7 39.0002 7C42.8662 7 46.0003 10.134 46.0003 14C46.0003 17.866 42.8662 21 39.0002 21C35.1341 21 32 17.866 32 14V2ZM39 17.9998C41.2091 17.9998 43 16.209 43 13.9999C43 11.7908 41.2091 10 39 10C36.7909 10 35 11.7908 35 13.9999C35 16.209 36.7909 17.9998 39 17.9998ZM19 7H16V14C16 14.9192 16.1811 15.8295 16.5329 16.6788C16.8846 17.5281 17.4003 18.2997 18.0503 18.9497C18.7003 19.5997 19.472 20.1154 20.3213 20.4671C21.1706 20.8189 22.0809 21 23.0002 21C23.9194 21 24.8297 20.8189 25.679 20.4671C26.5283 20.1154 27.3 19.5997 27.95 18.9497C28.6 18.2997 29.1157 17.5281 29.4675 16.6788C29.8192 15.8295 30.0003 14.9192 30.0003 14H30V7H27V14C27 15.0608 26.5785 16.0782 25.8284 16.8283C25.0783 17.5784 24.0609 17.9998 23 17.9998C21.9391 17.9998 20.9217 17.5784 20.1716 16.8283C19.4215 16.0782 19 15.0608 19 14V7Z"
                        fill="currentColor"
                      />
                    </svg>
                  </Link>
                </div>
                {/* Social icons */}
                <div className="flex items-center gap-3">
                  {[
                    { label: "Twitter", href: "https://twitter.com/dubdotco" },
                    { label: "LinkedIn", href: "https://www.linkedin.com/company/dubinc" },
                    { label: "GitHub", href: "https://github.com/dubinc/dub" },
                    { label: "YouTube", href: "https://www.youtube.com/@dubdotco" },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full p-1 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="mt-16 grid grid-cols-2 gap-4 xl:col-span-2 xl:mt-0">
                <div className="md:grid md:grid-cols-2">
                  <div className="grid gap-8">
                    <FooterColumn
                      title="Product"
                      links={[
                        "Dub Links",
                        "Dub Partners",
                        "Dub Analytics",
                        "Dub API",
                        "Dub Enterprise",
                      ]}
                    />
                    <FooterColumn
                      title="Solutions"
                      links={[
                        "Marketing attribution",
                        "Content creators",
                        "Affiliate management",
                      ]}
                    />
                  </div>
                  <div className="mt-10 grid gap-8 md:mt-0">
                    <FooterColumn
                      title="Resources"
                      links={[
                        "Docs",
                        "Help Center",
                        "Integrations",
                        "Pricing",
                        "Affiliates",
                      ]}
                    />
                    <FooterColumn
                      title="Company"
                      links={[
                        "About",
                        "Blog",
                        "Careers",
                        "Changelog",
                        "Customers",
                        "Brand",
                        "Contact",
                        "Privacy",
                      ]}
                    />
                  </div>
                </div>
                <div>
                  <FooterColumn
                    title="Compare"
                    links={[
                      "Bitly",
                      "Rebrandly",
                      "Short.io",
                      "Bl.ink",
                      "Rewardful",
                      "PartnerStack",
                      "FirstPromoter",
                      "Tolt",
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 sm:flex-row">
              <p className="text-sm text-neutral-400">
                &copy; 2026 Dub Technologies, Inc.
              </p>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <img
                  src="https://assets.dub.co/misc/soc2.svg"
                  alt="SOC 2"
                  className="h-5 w-auto"
                />
                SOC 2 Type II Certified
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ============ Components ============ */

function GridSVG({ id }: { id: string }) {
  return (
    <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern
          id={`dub-grid-${id}`}
          width="60"
          height="60"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 60 0 L 0 0 0 60"
            fill="none"
            stroke="rgb(229 229 229)"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#dub-grid-${id})`} />
    </svg>
  );
}

function FeatureSection({
  id,
  color,
  icon,
  label,
  title,
  description,
  ctaText,
  ctaHref,
  testimonial,
  subFeatures,
}: {
  id: string;
  color: "orange" | "green" | "purple";
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  testimonial: {
    quote: string;
    name: string;
    title: string;
    avatar: string;
  };
  subFeatures: {
    icon: React.ReactNode;
    name: string;
    description: string;
    href: string;
    screenshot: string;
    screenshotAlt: string;
  }[];
}) {
  const colorMap = {
    orange: { bg: "bg-orange-400", text: "text-orange-900", link: "text-orange-600" },
    green: { bg: "bg-green-400", text: "text-green-900", link: "text-green-600" },
    purple: { bg: "bg-purple-400", text: "text-purple-900", link: "text-purple-600" },
  };
  const c = colorMap[color];

  return (
    <div className="grid-section relative overflow-clip border-y border-grid-border px-4 [.grid-section~&]:border-t-0">
      <div className="relative z-0 mx-auto max-w-grid-width border-x border-grid-border pb-10 pt-10 sm:pt-20">
        {/* Header */}
        <div className="flex flex-col px-4 sm:px-10">
          <div className="flex items-center gap-2">
            <span
              className={`flex size-4 items-center justify-center rounded border border-black/5 ${c.text} ${c.bg}`}
            >
              {icon}
            </span>
            <span className="text-xs font-medium text-neutral-600">
              {label}
            </span>
          </div>
          <h2 className="mt-3 max-w-lg text-pretty font-display text-3xl font-medium text-neutral-900 sm:text-4xl md:text-5xl">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-pretty text-base text-neutral-500 sm:text-lg">
            {description}
          </p>
          <div className="mt-8">
            <Link
              href={ctaHref}
              className="mx-[unset] flex max-w-fit rounded-lg border border-neutral-200 bg-white px-5 py-2 text-sm font-medium text-neutral-900 shadow-sm transition-all hover:border-neutral-400 hover:text-neutral-800 hover:ring-4 hover:ring-neutral-200"
            >
              {ctaText}
            </Link>
          </div>
        </div>

        {/* Interactive screenshot + sub-feature tabs */}
        <FeatureTabs subFeatures={subFeatures} linkColor={c.link} />

        {/* Testimonial */}
        <div className="px-4 pb-2 pt-4 sm:px-10">
          <TestimonialInline
            quote={testimonial.quote}
            name={testimonial.name}
            title={testimonial.title}
            avatar={testimonial.avatar}
          />
        </div>
      </div>
    </div>
  );
}

function TestimonialInline({
  quote,
  name,
  title,
  avatar,
}: {
  quote: string;
  name: string;
  title: string;
  avatar: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="text-sm leading-relaxed text-neutral-500 italic">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-700">{name}</span>
          <span className="text-xs font-medium text-neutral-500">{title}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={name}
            loading="lazy"
            width={64}
            height={64}
            className="mt-4 size-8 rounded-full border border-neutral-200 blur-[2px]"
            src={avatar}
          />
        </div>
      </div>
    </div>
  );
}

function CustomerCard({
  company,
  logo,
  quote,
  name,
  title,
  avatar,
}: {
  company: string;
  logo: string;
  quote: string;
  name: string;
  title: string;
  avatar: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-8">
      <div className="mb-6 text-lg font-bold tracking-tight text-neutral-900">
        {company}
      </div>
      <blockquote
        className="text-sm leading-relaxed text-neutral-600"
        dangerouslySetInnerHTML={{ __html: `&ldquo;${quote}&rdquo;` }}
      />
      <div className="mt-4 flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={name}
          src={avatar}
          width={40}
          height={40}
          className="size-10 rounded-full border border-neutral-200"
          loading="lazy"
        />
        <div>
          <p className="text-sm font-medium text-neutral-900">{name}</p>
          <p className="text-xs text-neutral-500">{title}</p>
        </div>
      </div>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: string[];
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-neutral-900">{title}</h3>
      <ul role="list" className="mt-2.5 flex flex-col gap-3.5">
        {links.map((link) => (
          <li key={link}>
            <Link
              href="#"
              className="text-sm text-neutral-500 transition-colors duration-75 hover:text-neutral-700"
            >
              {link}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
