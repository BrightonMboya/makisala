/**
 * Client-safe plan configuration. No server dependencies.
 * Import this from client components. For server utilities, import from plans.ts.
 */

export type PlanTier = 'free' | 'starter' | 'pro' | 'business';

export const TIER_ORDER: PlanTier[] = ['free', 'starter', 'pro', 'business'];

export type Feature =
  | 'activeProposals'
  | 'uploadImages'
  | 'teamMembers'
  | 'allThemes'
  | 'noWatermark'
  | 'pdfExport'
  | 'comments'
  | 'customDomains';

export interface PlanLimits {
  activeProposals: number; // -1 = unlimited
  teamMembers: number; // -1 = unlimited
  uploadImages: boolean;
  allThemes: boolean;
  noWatermark: boolean;
  pdfExport: boolean;
  comments: boolean;
  customDomains: boolean;
}

export interface PlanConfig {
  name: string;
  price: number; // monthly price in USD
  limits: PlanLimits;
}

export const PLAN_CONFIG: Record<PlanTier, PlanConfig> = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      activeProposals: 2,
      teamMembers: 0,
      uploadImages: false,
      allThemes: false,
      noWatermark: false,
      pdfExport: false,
      comments: false,
      customDomains: false,
    },
  },
  starter: {
    name: 'Starter',
    price: 49,
    limits: {
      activeProposals: 5,
      teamMembers: 0,
      uploadImages: false,
      allThemes: false,
      noWatermark: false,
      pdfExport: true,
      comments: false,
      customDomains: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 99,
    limits: {
      activeProposals: -1,
      teamMembers: 3,
      uploadImages: true,
      allThemes: true,
      noWatermark: true,
      pdfExport: true,
      comments: true,
      customDomains: false,
    },
  },
  business: {
    name: 'Business',
    price: 249,
    limits: {
      activeProposals: -1,
      teamMembers: -1,
      uploadImages: true,
      allThemes: true,
      noWatermark: true,
      pdfExport: true,
      comments: true,
      customDomains: true,
    },
  },
};

export const ALLOWED_THEMES_BY_TIER: Record<PlanTier, string[]> = {
  free: ['minimalistic'],
  starter: ['minimalistic'],
  pro: ['minimalistic', 'kudu', 'discovery', 'safari-portal'],
  business: ['minimalistic', 'kudu', 'discovery', 'safari-portal'],
};
