import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { Calendar, Building, TreePine, Car, Plane, Settings as SettingsIcon } from 'lucide-react';
import { SeasonsTab } from './_components/seasons-tab';
import { AccommodationRatesTab } from './_components/accommodation-rates-tab';
import { ParkFeesTab } from './_components/park-fees-tab';
import { VehiclesTab } from './_components/vehicles-tab';
import { TransfersTab } from './_components/transfers-tab';
import { PricingSettingsTab } from './_components/pricing-settings-tab';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function RateCardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const validTabs = ['seasons', 'accommodations', 'parks', 'vehicles', 'transfers', 'settings'];
  const defaultTab =
    params.tab && validTabs.includes(params.tab) ? params.tab : 'seasons';

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Rate Cards</h1>
          <p className="mt-2 text-stone-600">
            Supplier rates and pricing settings used by the auto-pricing engine.
          </p>
        </div>

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 p-1 lg:grid-cols-6">
            <TabsTrigger value="seasons" className="gap-2 py-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Seasons</span>
            </TabsTrigger>
            <TabsTrigger value="accommodations" className="gap-2 py-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Hotels</span>
            </TabsTrigger>
            <TabsTrigger value="parks" className="gap-2 py-2">
              <TreePine className="h-4 w-4" />
              <span className="hidden sm:inline">Park Fees</span>
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="gap-2 py-2">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Vehicles</span>
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-2 py-2">
              <Plane className="h-4 w-4" />
              <span className="hidden sm:inline">Transfers</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 py-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seasons">
            <SeasonsTab />
          </TabsContent>
          <TabsContent value="accommodations">
            <AccommodationRatesTab />
          </TabsContent>
          <TabsContent value="parks">
            <ParkFeesTab />
          </TabsContent>
          <TabsContent value="vehicles">
            <VehiclesTab />
          </TabsContent>
          <TabsContent value="transfers">
            <TransfersTab />
          </TabsContent>
          <TabsContent value="settings">
            <PricingSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
