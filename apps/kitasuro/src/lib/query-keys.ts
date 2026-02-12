// Centralized query key definitions for React Query
// This ensures consistency across the app and makes invalidation easier

export const queryKeys = {
  // Onboarding data (organization + tour count) - lightweight check
  onboardingData: (userId?: string) => ['onboardingData', userId] as const,

  // Proposals
  proposals: {
    all: ['proposals'] as const,
    list: (userId?: string, filter?: 'mine' | 'all') => ['proposals', userId, filter ?? 'mine'] as const,
    detail: (id: string) => ['proposals', id] as const,
    forBuilder: (id: string) => ['proposals', 'builder', id] as const,
  },

  // Tours
  tours: {
    all: ['tours'] as const,
    list: (userId?: string) => ['tours', userId] as const,
    detail: (id: string) => ['tours', id] as const,
    byOrganization: ['tours', 'organization'] as const,
    shared: ['sharedTemplates'] as const,
  },

  // Combined data for forms/dialogs
  toursAndClients: (userId?: string) => ['toursAndClients', userId] as const,

  // Clients
  clients: {
    all: ['clients'] as const,
    detail: (id: string) => ['clients', id] as const,
  },

  // National Parks (destinations)
  nationalParks: ['nationalParks'] as const,

  // Accommodations
  accommodations: {
    all: ['accommodations'] as const,
    detail: (id: string) => ['accommodations', id] as const,
    byIds: (ids: string[]) => ['accommodations', 'batch', ids] as const,
  },

  // Comments
  comments: (proposalId: string) => ['comments', proposalId] as const,

  // Proposal Notes (internal team notes)
  notes: (proposalId: string) => ['notes', proposalId] as const,
} as const;

// Default stale times
export const staleTimes = {
  nationalParks: 5 * 60 * 1000, // 5 minutes - rarely changes
  accommodations: 5 * 60 * 1000, // 5 minutes
  proposals: 30 * 1000, // 30 seconds
  tours: 60 * 1000, // 1 minute
  clients: 60 * 1000, // 1 minute
  toursAndClients: 60 * 1000, // 1 minute
  comments: 30 * 1000, // 30 seconds
  notes: 30 * 1000, // 30 seconds
  dashboardData: 60 * 1000, // 1 minute
} as const;
