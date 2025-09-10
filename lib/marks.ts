// Marks system constants and utilities

export const MARKS_LIMITS = {
  USER_MAX: 5000,                    // Maximum marks a user can hold
  SURVEY_MAX: 3000,                  // Maximum marks for a single survey boost
  COMMISSION_RATE: 0.04,             // 4% commission on boosted surveys
  DAILY_WITHDRAWAL_LIMIT: 1000,      // Daily withdrawal limit in WLD
  MIN_WITHDRAWAL: 10,                // Minimum withdrawal amount
  WLD_TO_MARKS_RATE: 100             // 1 WLD = 100 Marks (example rate)
};

// Calculate marks after commission
export function calculateMarksAfterCommission(boostMarks: number): number {
  const commission = Math.floor(boostMarks * MARKS_LIMITS.COMMISSION_RATE);
  return boostMarks - commission;
}

// Calculate marks per helper
export function calculateMarksPerHelper(boostMarks: number, goalCount: number): number {
  const marksAfterCommission = calculateMarksAfterCommission(boostMarks);
  return Math.floor(marksAfterCommission / goalCount);
}

// Calculate marks distribution for helpers with commission details
export function calculateMarksDistribution(boostMarks: number, goalCount: number): {
  marksPerHelper: number;
  commission: number;
  totalDistributed: number;
} {
  const commission = Math.floor(boostMarks * MARKS_LIMITS.COMMISSION_RATE);
  const marksAfterCommission = boostMarks - commission;
  const marksPerHelper = Math.floor(marksAfterCommission / goalCount);
  const totalDistributed = marksPerHelper * goalCount;
  
  return {
    marksPerHelper,
    commission,
    totalDistributed
  };
}

// Validate marks limits
export function validateMarksLimits(currentMarks: number, additionalMarks: number): {
  valid: boolean;
  error?: string;
} {
  const newTotal = currentMarks + additionalMarks;
  
  if (newTotal > MARKS_LIMITS.USER_MAX) {
    return {
      valid: false,
      error: `Cannot exceed maximum of ${MARKS_LIMITS.USER_MAX} marks. You would have ${newTotal} marks.`
    };
  }
  
  return { valid: true };
}

// Validate survey boost amount
export function validateSurveyBoost(boostMarks: number): {
  valid: boolean;
  error?: string;
} {
  if (boostMarks > MARKS_LIMITS.SURVEY_MAX) {
    return {
      valid: false,
      error: `Maximum boost is ${MARKS_LIMITS.SURVEY_MAX} marks per survey.`
    };
  }
  
  if (boostMarks < 1) {
    return {
      valid: false,
      error: 'Boost amount must be at least 1 mark.'
    };
  }
  
  return { valid: true };
}

// Convert WLD to Marks
export function wldToMarks(wldAmount: number): number {
  return Math.floor(wldAmount * MARKS_LIMITS.WLD_TO_MARKS_RATE);
}

// Convert Marks to WLD
export function marksToWld(marksAmount: number): number {
  return marksAmount / MARKS_LIMITS.WLD_TO_MARKS_RATE;
}
