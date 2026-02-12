'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PlanTier, Feature } from '@/lib/plans-config';
import { PLAN_CONFIG } from '@/lib/plans-config';

interface PlanInfo {
  tier: PlanTier;
  effectiveTier: PlanTier;
  isTrialing: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  limits: {
    activeProposals: number;
    teamMembers: number;
    uploadImages: boolean;
    allThemes: boolean;
    noWatermark: boolean;
    pdfExport: boolean;
    comments: boolean;
    customDomains: boolean;
  };
}

interface PlanContextType {
  plan: PlanInfo | null;
  isLoading: boolean;
  canAccess: (feature: Feature) => boolean;
  refreshPlan: () => void;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = async () => {
    try {
      const res = await fetch('/api/plan');
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
      }
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const canAccess = (feature: Feature): boolean => {
    if (!plan) return false;
    const limits = plan.limits;

    switch (feature) {
      case 'activeProposals':
        return limits.activeProposals === -1;
      case 'teamMembers':
        return limits.teamMembers !== 0;
      case 'uploadImages':
        return limits.uploadImages;
      case 'allThemes':
        return limits.allThemes;
      case 'noWatermark':
        return limits.noWatermark;
      case 'pdfExport':
        return limits.pdfExport;
      case 'comments':
        return limits.comments;
      case 'customDomains':
        return limits.customDomains;
      default:
        return false;
    }
  };

  return (
    <PlanContext.Provider value={{ plan, isLoading, canAccess, refreshPlan: fetchPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (context === undefined) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return context;
}

export type { PlanTier, Feature };
