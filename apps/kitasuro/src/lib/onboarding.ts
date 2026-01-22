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

const ONBOARDING_KEY = 'kitasuro_onboarded';

/**
 * Check if onboarding is complete from localStorage (keyed by user ID)
 */
export function isOnboardingComplete(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(`${ONBOARDING_KEY}_${userId}`);
    return stored === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark onboarding as complete in localStorage
 */
export function setOnboardingComplete(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, 'true');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear onboarding flag (for when user needs to re-verify)
 */
export function clearOnboardingComplete(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${ONBOARDING_KEY}_${userId}`);
  } catch {
    // Ignore storage errors
  }
}

interface Organization {
  id: string;
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  notificationEmail?: string | null;
  onboardingCompletedAt?: Date | null;
}

/**
 * Check if organization name is a default auto-generated name
 * These patterns match auto-generated names during signup (e.g., "John's Agency")
 */
function isDefaultOrganizationName(name: string | null | undefined): boolean {
  // Treat empty or excessively long names as default
  if (!name || name.length > 255) return true;

  const lowerName = name.toLowerCase();

  // Check for default organization name patterns:
  // - "John's Agency" (any name followed by 's Agency)
  // - "User's Agency" (default when no name provided)
  return lowerName.endsWith("'s agency") || lowerName === "user's agency";
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
