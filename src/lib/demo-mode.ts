/**
 * OptiTrain.ai - Environment & Demo Mode Controller
 *
 * Enforces strict data integrity across the platform:
 * 1. Mock data fallback is allowed ONLY in non-production OR when explicit demo mode is configured.
 * 2. In strict production, database outages result in a 503 Service Unavailable response,
 *    never silent substitution with synthetic records.
 * 3. All demonstration records are explicitly tagged to prevent confusing them with verified records.
 */

export function isDemoModeAllowed(): boolean {
  if (process.env.DISABLE_DEMO_MODE === "true") {
    return false;
  }
  if (
    process.env.ENABLE_DEMO_MODE === "true" ||
    process.env.ENABLE_DEMO_DATA === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true"
  ) {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}

export function shouldFallbackToMock(): boolean {
  return isDemoModeAllowed();
}

export interface DemoMetadata {
  isDemoData: boolean;
  environment: string;
  notice?: string;
}

export function createDemoMetadata(): DemoMetadata {
  return {
    isDemoData: true,
    environment: process.env.NODE_ENV || "development",
    notice: "Demonstration dataset active for practice evaluation and testing.",
  };
}
