export interface OnboardingStep {
  complete: boolean;
  current: string | null;
}

export interface OnboardingStatus {
  isComplete: boolean;
  completedCount: number;
  totalSteps: number;
  steps: {
    organizationName: OnboardingStep;
    notificationEmail: OnboardingStep;
    hasTours: OnboardingStep & { count: number };
  };
}

interface Organization {
  id: string;
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  notificationEmail?: string | null;
}

/**
 * Check if organization name is a default auto-generated name
 * These patterns match auto-generated names during signup (e.g., "John's Agency")
 */
function isDefaultOrganizationName(name: string | null | undefined): boolean {
  // Treat empty or excessively long names as default (prevents regex performance issues)
  if (!name || name.length > 255) return true;

  // Pattern to detect default organization names:
  // - "John's Agency" (any name followed by 's Agency)
  // - "User's Agency" (default when no name provided)
  const defaultPatterns = [
    /'s Agency$/i,           // Ends with "'s Agency"
    /^User's Agency$/i,      // Exactly "User's Agency"
  ];

  return defaultPatterns.some(pattern => pattern.test(name));
}

/**
 * Check if an organization has completed all onboarding steps
 */
export function checkOnboardingStatus(
  organization: Organization | null | undefined,
  toursCount: number
): OnboardingStatus {
  // Organization must exist and have a non-default name
  const organizationNameComplete = !!(
    organization?.name && !isDefaultOrganizationName(organization.name)
  );

  const notificationEmailComplete = !!organization?.notificationEmail;

  const hasToursComplete = toursCount > 0;

  const steps = {
    organizationName: {
      complete: organizationNameComplete,
      current: organization?.name || null,
    },
    notificationEmail: {
      complete: notificationEmailComplete,
      current: organization?.notificationEmail || null,
    },
    hasTours: {
      complete: hasToursComplete,
      current: hasToursComplete ? `${toursCount} tour${toursCount === 1 ? '' : 's'}` : null,
      count: toursCount,
    },
  };

  const completedCount = [
    steps.organizationName.complete,
    steps.notificationEmail.complete,
    steps.hasTours.complete,
  ].filter(Boolean).length;

  return {
    isComplete: completedCount === 3,
    completedCount,
    totalSteps: 3,
    steps,
  };
}
