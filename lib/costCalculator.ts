export interface Insurance {
  planName: string;
  provider?: string;   // "blue-shield" | "aetna"
  deductible: number;
  outOfPocketMax: number;
  coinsurance: number; // 0.2 = 20%
}

export interface CostBreakdown {
  stickerPrice: number;
  yourCost: number;
  insuranceCovers: number;
  deductibleRemainingBefore: number;
  deductibleRemainingAfter: number;
  appliedToDeductible: number;
  coinsuranceApplied: number;
  hitOopMax: boolean;
}

/**
 * Calculates a patient's true out-of-pocket cost for a procedure given
 * their current insurance status and amount already paid this year.
 */
export function calculateRealCost(
  stickerPrice: number,
  amountPaidSoFar: number,
  insurance: Insurance
): CostBreakdown {
  const deductibleRemainingBefore = Math.max(
    insurance.deductible - amountPaidSoFar,
    0
  );

  let yourCost = 0;
  let appliedToDeductible = 0;
  let coinsuranceApplied = 0;

  if (deductibleRemainingBefore >= stickerPrice) {
    // Entire price goes toward (and is paid as) deductible
    appliedToDeductible = stickerPrice;
    yourCost = stickerPrice;
  } else {
    // Pay remaining deductible in full, then coinsurance % on the rest
    appliedToDeductible = deductibleRemainingBefore;
    const remainder = stickerPrice - deductibleRemainingBefore;
    coinsuranceApplied = remainder * insurance.coinsurance;
    yourCost = appliedToDeductible + coinsuranceApplied;
  }

  // Cap at out-of-pocket max
  const totalPaidIfThisHappens = amountPaidSoFar + yourCost;
  let hitOopMax = false;
  if (totalPaidIfThisHappens > insurance.outOfPocketMax) {
    const overage = totalPaidIfThisHappens - insurance.outOfPocketMax;
    yourCost = Math.max(yourCost - overage, 0);
    hitOopMax = true;
  }

  yourCost = Math.round(yourCost * 100) / 100;
  const insuranceCovers = Math.round((stickerPrice - yourCost) * 100) / 100;
  const deductibleRemainingAfter = Math.max(
    insurance.deductible - (amountPaidSoFar + appliedToDeductible),
    0
  );

  return {
    stickerPrice,
    yourCost,
    insuranceCovers,
    deductibleRemainingBefore,
    deductibleRemainingAfter,
    appliedToDeductible: Math.round(appliedToDeductible * 100) / 100,
    coinsuranceApplied: Math.round(coinsuranceApplied * 100) / 100,
    hitOopMax,
  };
}

export function totalPaidSoFar(visits: { amountPaid: number }[]): number {
  return visits.reduce((sum, v) => sum + v.amountPaid, 0);
}
