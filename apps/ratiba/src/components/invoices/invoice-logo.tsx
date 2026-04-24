'use client';

import { useFormContext, useWatch } from 'react-hook-form';

export function InvoiceLogo() {
  const { control } = useFormContext();
  const from = useWatch({ control, name: 'fromDetails' });
  const logoUrl = from?.logoUrl as string | undefined;

  if (logoUrl) {
    return (
      <div className="h-[72px] max-w-[220px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt="" className="h-full w-auto object-contain" />
      </div>
    );
  }

  return (
    <div className="h-[72px] w-[72px] bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]" />
  );
}
