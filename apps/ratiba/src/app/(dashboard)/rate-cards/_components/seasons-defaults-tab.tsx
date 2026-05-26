'use client';

import { SeasonsTab } from './seasons-tab';
import { PricingSettingsTab } from './pricing-settings-tab';

export function SeasonsDefaultsTab() {
  return (
    <div className="space-y-6">
      <SeasonsTab />
      <PricingSettingsTab />
    </div>
  );
}
