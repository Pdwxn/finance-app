const ONBOARDING_KEY = 'numa_onboarding_completed';
const ONBOARDING_CURRENCY_KEY = 'numa_onboarding_currency';

export function isOnboardingCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}

export function completeOnboarding(): void {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

export function getOnboardingCurrency(): string {
  if (typeof window === 'undefined') return 'CLP';
  return localStorage.getItem(ONBOARDING_CURRENCY_KEY) ?? 'CLP';
}

export function setOnboardingCurrency(currency: string): void {
  localStorage.setItem(ONBOARDING_CURRENCY_KEY, currency);
}
