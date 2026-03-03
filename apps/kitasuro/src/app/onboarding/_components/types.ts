export const ONBOARDING_STEPS = ['workspace', 'notification', 'tours', 'success'] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
