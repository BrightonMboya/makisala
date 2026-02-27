"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useAutoRotate } from "./useAutoRotate";

const tabs = [
  {
    value: "links",
    label: "Short Links",
    color: { bg: "bg-orange-400", text: "text-orange-900" },
    icon: (
      <svg width="11" height="10" fill="none" viewBox="0 0 11 10" className="size-2.5">
        <path stroke="currentColor" strokeLinecap="round" strokeWidth="3.333" d="M5.5 5.667v-4M5.5 5.667l-3.333 2M5.5 5.667l3.333 2" />
      </svg>
    ),
    screenshot: "https://assets.dub.co/brand/screenshot-01.jpg",
    barIcon: (
      <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4 text-neutral-50">
        <g fill="currentColor">
          <path d="M12.188,16.484c-1.097,0-2.192-.417-3.026-1.252l-2.175-2.175c-1.671-1.671-1.671-4.39,0-6.061,.356-.356,.753-.637,1.19-.846,.371-.18,.82-.021,1,.354,.179,.374,.021,.821-.354,1-.283,.135-.541,.318-.766,.543-1.096,1.096-1.096,2.863-.01,3.95l2.175,2.175c1.086,1.085,2.853,1.086,3.939,0,1.096-1.096,1.096-2.863,.01-3.949l-.931-.931c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l.931,.931c1.671,1.671,1.671,4.389,0,6.06-.842,.842-1.944,1.262-3.044,1.262Z" />
          <path d="M9.501,11.923c-.28,0-.548-.157-.677-.427-.179-.374-.021-.821,.354-1,.283-.135,.541-.318,.766-.543,1.096-1.096,1.096-2.863,.01-3.95l-2.175-2.175c-1.085-1.085-2.853-1.086-3.939,0-1.096,1.096-1.096,2.863-.01,3.949l.931,.931c.293,.293,.293,.768,0,1.061s-.768,.293-1.061,0l-.931-.931c-1.671-1.671-1.671-4.389,0-6.06,1.682-1.681,4.4-1.682,6.07-.01l2.175,2.175c1.671,1.671,1.671,4.39,0,6.061-.356,.356-.753,.637-1.19,.846-.104,.05-.214,.073-.323,.073Z" />
        </g>
      </svg>
    ),
    barTitle: "Short Links",
    barDescription:
      "Create and manage short links at scale, with advanced features, folders, and role-based access control",
  },
  {
    value: "analytics",
    label: "Conversion Analytics",
    color: { bg: "bg-green-400", text: "text-green-900" },
    icon: (
      <svg width="10" height="10" fill="none" viewBox="0 0 10 10" className="size-2.5">
        <path stroke="currentColor" strokeLinecap="round" strokeWidth="3.333" d="M2.333 6.333v2M7.667 1.667v6.666" />
      </svg>
    ),
    screenshot: "https://assets.dub.co/home/features/funnel-chart-mini.png",
    barIcon: (
      <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4 text-neutral-50">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor">
          <path d="M2.75 10.75L6.396 7.10401C6.591 6.90901 6.908 6.90901 7.103 7.10401L10.396 10.397C10.591 10.592 10.908 10.592 11.103 10.397L15.249 6.25101" />
          <path d="M2.75 2.75V12.75C2.75 13.855 3.645 14.75 4.75 14.75H15.25" />
        </g>
      </svg>
    ),
    barTitle: "Conversion Analytics",
    barDescription:
      "Understand exactly how your marketing drives revenue with Dub's powerful attribution engine",
  },
  {
    value: "partners",
    label: "Affiliate Programs",
    color: { bg: "bg-purple-400", text: "text-purple-900" },
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 32 32" className="size-2.5">
        <circle cx="27" cy="16" r="5" fill="currentColor" />
        <circle cx="5" cy="16" r="5" fill="currentColor" />
        <circle cx="16" cy="27" r="5" fill="currentColor" />
        <circle cx="16" cy="5" r="5" fill="currentColor" />
      </svg>
    ),
    screenshot: "https://assets.dub.co/home/features/embed-demo.jpg",
    barIcon: (
      <svg height="18" width="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" className="size-4 text-neutral-50">
        <g fill="currentColor">
          <circle cx="14" cy="9" r="3" />
          <circle cx="4" cy="9" r="3" />
          <circle cx="9" cy="14" r="3" />
          <circle cx="9" cy="4" r="3" />
        </g>
      </svg>
    ),
    barTitle: "Affiliate Programs",
    barDescription:
      "All-in-one partner management platform for building profitable affiliate and referral programs",
  },
];

export function ProductTabs() {
  const { active, select: setActive } = useAutoRotate(tabs.length);

  return (
    <>
      {/* Curved SVG connector with tabs inside */}
      <div className="relative top-0 z-0 mx-auto mt-0 flex h-16 max-w-[min(700px,calc(100vw-2rem))] -translate-y-px items-start justify-center text-neutral-100 max-md:h-auto md:text-white max-md:[&>svg]:w-4">
        <svg
          viewBox="0 0 85 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto shrink-0 translate-x-px translate-y-px overflow-visible"
        >
          <rect x="0" y="0" width="85" height="1" fill="currentColor" transform="translate(0, -1)" />
          <path d="M50 45C57.3095 56.6952 71.2084 63.9997 85 64V0H0C13.7915 0 26.6905 7.30481 34 19L50 45Z" fill="currentColor" />
        </svg>
        <div className="border-t-1 relative z-10 h-[calc(100%+1px)] min-w-0 grow border-current bg-current">
          <div className="flex size-full flex-wrap items-center justify-center gap-2.5 max-md:pt-4">
            {tabs.map((tab, i) => (
              <button
                key={tab.value}
                onClick={() => setActive(i)}
                className={`group flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  i === active
                    ? "border-neutral-200 bg-white text-neutral-800 drop-shadow-sm md:border-neutral-200"
                    : "border-transparent bg-neutral-100 text-neutral-600 hover:text-neutral-800"
                }`}
              >
                <span
                  className={`flex size-4 items-center justify-center rounded border border-black/5 ${tab.color.bg} ${tab.color.text} drop-shadow-md transition-transform group-hover:scale-110`}
                >
                  {tab.icon}
                </span>
                <span className="leading-none">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        <svg
          viewBox="0 0 85 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-auto shrink-0 -translate-x-px translate-y-px -scale-x-100 overflow-visible"
        >
          <rect x="0" y="0" width="85" height="1" fill="currentColor" transform="translate(0, -1)" />
          <path d="M50 45C57.3095 56.6952 71.2084 63.9997 85 64V0H0C13.7915 0 26.6905 7.30481 34 19L50 45Z" fill="currentColor" />
        </svg>
      </div>

      {/* Tab content panels — grid stacking keeps natural height */}
      <div className="mx-auto mt-6 max-w-[940px] px-4 [perspective:1000px]">
        <div className="relative grid h-[380px] md:h-[580px]">
          {tabs.map((tab, i) => (
            <div
              key={tab.value}
              className={`col-start-1 row-start-1 transition-[opacity,transform] duration-300 ${
                i === active
                  ? "opacity-100 translate-x-0"
                  : "pointer-events-none opacity-0 translate-x-[50px]"
              }`}
            >
              <div className="size-full rounded-t-xl border-x border-t border-neutral-200 px-1.5 pt-1.5 sm:rounded-t-[1.25rem] sm:px-3 sm:pt-3 [mask-image:linear-gradient(black_50%,transparent_90%)]">
                <div className="relative size-full overflow-hidden rounded-t-lg border-x border-t border-neutral-300 bg-white drop-shadow-sm sm:rounded-t-xl">
                  <img
                    src={tab.screenshot}
                    alt={`Dub dashboard - ${tab.label}`}
                    className="h-full w-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Bottom floating bar */}
              <div className="absolute bottom-10 w-full md:px-4">
                <div className="mx-auto flex w-full max-w-[800px] flex-col items-center gap-4 rounded-xl bg-neutral-800 p-4 text-center md:flex-row md:p-5 md:text-left">
                  <div className="hidden size-8 shrink-0 items-center justify-center rounded-lg border border-neutral-600 bg-neutral-700 md:flex">
                    {tab.barIcon}
                  </div>
                  <div className="min-w-0 grow">
                    <span className="text-sm font-medium text-white">
                      {tab.barTitle}
                    </span>
                    <p className="text-xs text-neutral-400 max-md:mt-2">
                      {tab.barDescription}
                    </p>
                  </div>
                  <Link
                    href="#"
                    className="w-full shrink-0 whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 md:w-auto"
                  >
                    Learn more
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
