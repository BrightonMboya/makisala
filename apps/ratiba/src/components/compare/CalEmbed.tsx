'use client';

import Cal, { getCalApi } from '@calcom/embed-react';
import { useEffect } from 'react';

const CAL_LINK = 'brightonmboya/30min';

export function CalEmbed() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({ namespace: '30min' });
      cal('ui', {
        hideEventTypeDetails: false,
      });
    })();
  }, []);

  return (
    <Cal
      namespace="30min"
      calLink={CAL_LINK}
      style={{ width: '100%', minWidth: '320px' }}
      config={{
        layout: 'month_view',
      }}
    />
  );
}
