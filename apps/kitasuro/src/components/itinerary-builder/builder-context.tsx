'use client';

import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type {
  BuilderContextType,
  BuilderDay,
  TravelerGroup,
  PricingRow,
  ExtraOption,
  ThemeType,
} from '@/types/itinerary-types';

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export function BuilderProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: any;
}) {
  // Tour Details
  const [tourId, setTourId] = useState<string | null>(null);
  const [tourType, setTourType] = useState('Private Tour');
  const [clientId, setClientId] = useState<string | null>(null);
  const [tourTitle, setTourTitle] = useState('');
  const [travelerGroups, setTravelerGroups] = useState<TravelerGroup[]>([
    { id: '1', count: 2, type: 'Adult' },
  ]);

  // Day by Day - Start empty, will be populated from database via initialData
  const [days, setDays] = useState<BuilderDay[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [transferIncluded, setTransferIncluded] = useState('included');
  const [pickupPoint, setPickupPoint] = useState('');

  // Pricing
  const [pricingRows, setPricingRows] = useState<PricingRow[]>([
    { id: '1', count: 2, type: 'Adult', unitPrice: 0 },
  ]);
  const [extras, setExtras] = useState<ExtraOption[]>([
    { id: '1', name: 'Airport Transfer', price: 50, selected: false },
  ]);

  const [inclusions, setInclusions] = useState<string[]>([
    'All park fees and government taxes',
    'Accommodation relating to this tour',
    'All meals as specified in the itinerary',
    'Transportation in 4WD safari jeep',
    'Services of a professional English speaking driver guide',
    'Drinking water in the vehicle',
  ]);
  const [exclusions, setExclusions] = useState<string[]>([
    'International flights',
    'Visas',
    'Travel insurance',
    'Tips & Gratitude',
    'Alcoholic drinks',
    'Personal items (souvenirs, etc.)',
  ]);

  // Theme
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('minimalistic');
  const [heroImage, setHeroImage] = useState<string>(
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop'
  );

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.tourId) setTourId(initialData.tourId);
      if (initialData.tourType) setTourType(initialData.tourType);
      if (initialData.clientId) setClientId(initialData.clientId);
      if (initialData.tourTitle) setTourTitle(initialData.tourTitle);
      if (initialData.days) setDays(initialData.days);
      if (initialData.startDate) setStartDate(new Date(initialData.startDate));

      // Handle pricing
      // If we have explicit pricing rows from a saved proposal, use them
      if (initialData.pricingRows && initialData.pricingRows.length > 0) {
        setPricingRows(initialData.pricingRows);
        // Also ensure traveler groups are set if they exist, otherwise we desync
        if (initialData.travelerGroups) {
             setTravelerGroups(initialData.travelerGroups);
        }
      } else {
          // Fallback logic for new tours or when pricingRows are missing
          const tourPrice = initialData.price ? Number(initialData.price) : null;

          // Handle traveler groups and sync pricing rows
          if (
            initialData.travelerGroups &&
            Array.isArray(initialData.travelerGroups) &&
            initialData.travelerGroups.length > 0
          ) {
            setTravelerGroups(initialData.travelerGroups);
            // Sync pricing rows with initial traveler groups
            setPricingRows(
              initialData.travelerGroups.map((g: TravelerGroup) => ({
                id: g.id,
                count: g.count,
                type: g.type,
                unitPrice:
                  tourPrice !== null
                    ? tourPrice
                    : pricingRows.find((r) => r.id === g.id)?.unitPrice || 0,
              })),
            );
          } else if (tourPrice !== null) {
            // If no traveler groups provided but price is, update existing rows with tour price
            setPricingRows((prev) => {
              if (prev.length === 0) {
                // If no rows exist, create one with the tour price based on current traveler groups
                const defaultGroup = travelerGroups[0] || { id: '1', count: 2, type: 'Adult' };
                return [
                  {
                    id: defaultGroup.id,
                    count: defaultGroup.count,
                    type: defaultGroup.type,
                    unitPrice: tourPrice,
                  },
                ];
              }
              // Update existing rows with tour price (only if they have zero or default price)
              return prev.map((row) => ({
                ...row,
                unitPrice: row.unitPrice > 0 && row.unitPrice !== 3000 ? row.unitPrice : tourPrice,
              }));
            });
          }
      }
      
      if (initialData.extras) setExtras(initialData.extras);
      if (initialData.inclusions) setInclusions(initialData.inclusions);
      if (initialData.exclusions) setExclusions(initialData.exclusions);

      // Add other fields as needed
      if (initialData.theme) setSelectedTheme(initialData.theme);
      if (initialData.selectedTheme) setSelectedTheme(initialData.selectedTheme);
      if (initialData.heroImage) setHeroImage(initialData.heroImage);
      if (initialData.startCity) setStartCity(initialData.startCity);
      if (initialData.endCity) setEndCity(initialData.endCity);
    }
  }, [initialData]);

  // Sync pricing rows when traveler groups change (optional, but requested behavior implies sync)
  // We only sync counts and types, preserving unit prices if IDs match
  useEffect(() => {
    setPricingRows((prevRows) => {
      // Get the base price from the first row if available, to use for new rows
      const firstRow = prevRows.length > 0 ? prevRows[0] : null;
      const basePrice = firstRow && firstRow.unitPrice > 0 ? firstRow.unitPrice : 0;

      return travelerGroups.map((group) => {
        const existingRow = prevRows.find((r) => r.id === group.id);
        if (existingRow) {
          // Preserve existing price if it's set, otherwise use base price
          return {
            ...existingRow,
            count: group.count,
            type: group.type,
            unitPrice: existingRow.unitPrice > 0 ? existingRow.unitPrice : basePrice,
          };
        }
        return {
          id: group.id,
          count: group.count,
          type: group.type,
          unitPrice: basePrice, // Use inferred base price
        };
      });
    });
  }, [travelerGroups]);

  return (
    <BuilderContext.Provider
      value={{
        tourId,
        setTourId,
        tourType,
        setTourType,
        clientId,
        setClientId,
        tourTitle,
        setTourTitle,
        travelerGroups,
        setTravelerGroups,
        days,
        setDays,
        startDate,
        setStartDate,
        startCity,
        setStartCity,
        endCity,
        setEndCity,
        transferIncluded,
        setTransferIncluded,
        pickupPoint,
        setPickupPoint,
        pricingRows,
        setPricingRows,
        extras,
        setExtras,
        inclusions,
        setInclusions,
        exclusions,
        setExclusions,
        selectedTheme,
        setSelectedTheme,
        heroImage,
        setHeroImage,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (context === undefined) {
    throw new Error('useBuilder must be used within a BuilderProvider');
  }
  return context;
}
