// Calculate total reward pool based on survey goal count (system-controlled)
export function calculateRewardPool(goalCount: number): number {
  // Fixed tiers based on survey size with minimum 1 point per helper guarantee
  if (goalCount <= 10) return 50;        // Small: up to 5 points per person
  if (goalCount <= 50) return 100;       // Medium: up to 2 points per person  
  if (goalCount <= 200) return 200;      // Large: up to 1 point per person
  
  // For mega surveys, ensure at least 1 point per person
  return Math.max(300, goalCount);       // Mega: minimum 1 point per person guaranteed
}

// Calculate points per helper based on system-controlled reward pool
export function pointsPerHelper(goalCount: number): number {
  const totalPool = calculateRewardPool(goalCount);
  return Math.floor(totalPool / goalCount);
}

// Legacy function for backwards compatibility (now unused)
export function pointsForGoal(goal: number) {
  const base = 5 + 5 * Math.log10(Math.max(goal, 1));
  return Math.max(5, Math.min(18, Math.round(base)));
}
