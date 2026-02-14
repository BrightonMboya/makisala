'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PlanTier, PlanLimits, Feature } from '@/lib/plans-config';

interface PlanInfo {
  tier: PlanTier;
  effectiveTier: PlanTier;
  isTrialing: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  limits: PlanLimits;
}

interface PlanContextType {
  plan: PlanInfo | null;
  isLoading: boolean;
  canAccess: (feature: Feature) => boolean;
  refreshPlan: () => Promise<void>;
  /** Poll until the plan tier changes from current, useful after checkout */
  waitForPlanUpdate: () => Promise<void>;
}

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlan = useCallback(async (bustCache = false) => {
    try {
      const res = await fetch('/api/plan', bustCache ? { cache: 'no-store' } : undefined);
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        return data as PlanInfo;
      }
    } catch (error) {
      console.error('Failed to fetch plan:', error);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const waitForPlanUpdate = useCallback(async () => {
    const currentTier = plan?.tier ?? 'free';
    const maxAttempts = 10;
    const delayMs = 1500;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, delayMs));
      const updated = await fetchPlan(true);
      if (updated && updated.tier !== currentTier) return;
    }
  }, [plan?.tier, fetchPlan]);

  const canAccess = (feature: Feature): boolean => {
    if (!plan) return false;
    const value = plan.limits[feature];
    // Numeric limits: -1 = unlimited, 0 = disabled, >0 = has access
    if (typeof value === 'number') return value !== 0;
    // Boolean limits
    return value;
  };

  const refreshPlan = useCallback(() => fetchPlan(true).then(() => undefined), [fetchPlan]);

  return (
    <PlanContext.Provider value={{ plan, isLoading, canAccess, refreshPlan, waitForPlanUpdate }}>
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
