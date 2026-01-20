// Centralized query key definitions for React Query
// This ensures consistency across the app and makes invalidation easier

export const queryKeys = {
  // Dashboard data (clients, tours, proposals, organization) - used by sidebar
  dashboardData: (userId?: string) => ['dashboardData', userId] as const,

  // Onboarding data (organization + tour count) - lightweight check
  onboardingData: (userId?: string) => ['onboardingData', userId] as const,

  // Proposals
  proposals: {
    all: ['proposals'] as const,
    list: (userId?: string) => ['proposals', userId] as const,
    detail: (id: string) => ['proposals', id] as const,
    forBuilder: (id: string) => ['proposals', 'builder', id] as const,
  },

  // Tours
  tours: {
    all: ['tours'] as const,
    detail: (id: string) => ['tours', id] as const,
    byOrganization: ['tours', 'organization'] as const,
    shared: ['sharedTemplates'] as const,
  },

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
} as const;

// Default stale times
export const staleTimes = {
  nationalParks: 5 * 60 * 1000, // 5 minutes - rarely changes
  accommodations: 5 * 60 * 1000, // 5 minutes
  dashboardData: 30 * 1000, // 30 seconds
  proposals: 30 * 1000, // 30 seconds
  clients: 60 * 1000, // 1 minute
  comments: 30 * 1000, // 30 seconds
} as const;
