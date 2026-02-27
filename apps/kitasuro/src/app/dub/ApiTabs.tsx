"use client";

import { type ReactNode } from "react";
import { useAutoRotate } from "./useAutoRotate";

type ApiSubFeature = {
  icon?: ReactNode;
  name: string;
  description: string;
  href: string;
};

export function ApiTabs({
  subFeatures,
  children,
}: {
  subFeatures: ApiSubFeature[];
  children: ReactNode;
}) {
  const { active, select: setActive } = useAutoRotate(subFeatures.length);

  return (
    <>
      {/* Code block area stays static */}
      {children}

      {/* API sub-feature tabs (3-column) */}
      <div
        role="tablist"
        className="mx-auto grid w-full max-w-[800px] grid-cols-1 gap-x-10 gap-y-8 py-8 sm:grid-cols-3"
      >
        {subFeatures.map((sf, i) => (
          <div
            key={sf.name}
            role="tab"
            aria-selected={i === active}
            tabIndex={0}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActive(i);
              }
            }}
            className={`relative flex cursor-pointer flex-col pl-6 pr-2 text-left text-sm text-neutral-900 transition-opacity duration-500 ${
              i === active ? "" : "opacity-50 hover:opacity-70"
            }`}
          >
            {/* Left border indicator */}
            <div
              className={`absolute -left-px top-0 h-full w-px overflow-hidden transition-colors duration-300 ${
                i === active ? "bg-neutral-900" : "bg-neutral-200"
              }`}
            />
            {sf.icon && <div className="size-4">{sf.icon}</div>}
            <span className="mt-2 font-medium">{sf.name}</span>
            <p className="mt-3.5 text-neutral-500">{sf.description}</p>
            <a
              href={sf.href}
              className={`mt-3.5 inline-flex items-center text-sm font-medium transition-opacity duration-500 ${
                i === active
                  ? "text-neutral-700"
                  : "pointer-events-none text-neutral-500 opacity-50"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              Learn more
              <svg
                className="ml-0.5 size-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 16 16"
                width="16"
                height="16"
              >
                <path
                  fillRule="evenodd"
                  d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"
                />
              </svg>
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
