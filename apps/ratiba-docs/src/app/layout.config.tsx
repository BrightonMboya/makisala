import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: (
      <span className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#261B07]">
          <span className="text-sm font-bold leading-none text-[#F8F7F5]">R</span>
        </span>
        <span className="text-base font-semibold tracking-[-0.3px] text-[#261B07] dark:text-[#F8F7F5]">
          Ratiba
        </span>
      </span>
    ),
    url: 'https://docs.ratiba.io',
  },
  links: [
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
    {
      text: 'Website',
      url: 'https://ratiba.io',
      external: true,
    },
  ],
};
