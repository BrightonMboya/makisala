'use client';

import React, { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type {
  BuilderContextType,
  BuilderDay,
  TravelerGroup,
  PricingRow,
  ExtraOption,
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
  const [tourType, setTourType] = useState('Private Tour');
  const [clientName, setClientName] = useState('');
  const [tourTitle, setTourTitle] = useState('');
  const [travelerGroups, setTravelerGroups] = useState<TravelerGroup[]>([
    { id: '1', count: 2, type: 'Adult' },
  ]);

  // Day by Day - Start empty, will be populated from database via initialData
  const [days, setDays] = useState<BuilderDay[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startCity, setStartCity] = useState('');
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

  // Load initial data if provided
  useEffect(() => {
    if (initialData) {
      if (initialData.tourType) setTourType(initialData.tourType);
      if (initialData.clientName) setClientName(initialData.clientName);
      if (initialData.tourTitle) setTourTitle(initialData.tourTitle);
      if (initialData.days) setDays(initialData.days);
      if (initialData.startDate) setStartDate(new Date(initialData.startDate));

      // Handle pricing from tour data
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
      // Add other fields as needed
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
        tourType,
        setTourType,
        clientName,
        setClientName,
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
