export type VarRateMode = "trend" | "manual";

export interface VariableRateAdjustmentEntry {
  adjustmentIndex: number;
  rate: number;
}

export interface LoanDetails {
  assetCost: number;
  downPayment: number;
  interestRate: number;
  years: number;
  months: number;
  rateType?: "fixed" | "variable";
  varFixedYears?: number;
  varPeriodicity?: number;
  varMaxIncrease?: number;
  varVolatility?: number;
  varTrendScenario?: "best" | "average" | "worst";
  varRateMode?: VarRateMode;
  varManualRates?: VariableRateAdjustmentEntry[];
}

export interface ExtraPayment {
  id: string;
  type: "single" | "recurring";
  amount: number;
  period?: number; // single
  startPeriod?: number; // recurring
  endPeriod?: number; // recurring
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  currentRate: number;
  extraPaymentPaid?: number;
}

export interface AmortizationSchedule {
  rows: AmortizationRow[];
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalExtraPaid?: number;
  totalPaid: number;
  durationMonths: number;
}

function clampVariableRate(rate: number, baseRate: number, maxIncrease: number): number {
  return Math.max(1.0, Math.min(baseRate + maxIncrease, rate));
}

function getProjectedVariableRate(
  currentRate: number,
  baseRate: number,
  maxIncrease: number,
  volatility: number,
  trendScenario: "best" | "average" | "worst",
  month: number,
): number {
  if (trendScenario === "average") {
    const changeMagnitude = (Math.sin(month / 12) * volatility * 1.5) + (0.1 * volatility);
    let potentialNewRate = currentRate + changeMagnitude;
    return clampVariableRate(potentialNewRate, baseRate, maxIncrease);
  }

  if (trendScenario === "worst") {
    let potentialNewRate = currentRate + volatility;
    return clampVariableRate(potentialNewRate, baseRate, maxIncrease);
  }

  let potentialNewRate = currentRate - volatility;
  return clampVariableRate(potentialNewRate, baseRate, maxIncrease);
}

function resolveVariableRateAtAdjustment(
  currentRate: number,
  baseRate: number,
  maxIncrease: number,
  volatility: number,
  trendScenario: "best" | "average" | "worst",
  month: number,
  adjustmentIndex: number,
  rateMode: VarRateMode,
  manualRates: VariableRateAdjustmentEntry[] = [],
): number {
  if (rateMode === "manual") {
    const manualMatch = manualRates.find((entry) => entry.adjustmentIndex === adjustmentIndex);
    if (manualMatch && Number.isFinite(manualMatch.rate)) {
      return clampVariableRate(Number(manualMatch.rate), baseRate, maxIncrease);
    }
  }

  return getProjectedVariableRate(currentRate, baseRate, maxIncrease, volatility, trendScenario, month);
}

/**
 * Calculates standard amortization rows for a standard loan (fixed or variable rate ARM).
 */
export function calculateStandardRows(details: LoanDetails): AmortizationSchedule {
  const assetCost = Number(details.assetCost) || 0;
  const downPayment = Number(details.downPayment) || 0;
  const interestRate = Number(details.interestRate) || 0;
  const years = Number(details.years) || 0;
  const months = Number(details.months) || 0;
  const rateType = details.rateType || "fixed";
  const varFixedYears = Number(details.varFixedYears) || 5;
  const varPeriodicity = Number(details.varPeriodicity) || 12;
  const varMaxIncrease = Number(details.varMaxIncrease) || 4.0;
  const varVolatility = Number(details.varVolatility) || 0.5;
  const varTrendScenario = details.varTrendScenario || "average";
  const varRateMode = details.varRateMode || "trend";
  const varManualRates = details.varManualRates || [];

  const principal = Math.max(100, assetCost - downPayment);
  const totalMonths = Math.min(480, Math.max(6, years * 12 + months));

  const rows: AmortizationRow[] = [];
  let remainingBalance = principal;
  let currentRate = interestRate;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  for (let month = 1; month <= totalMonths; month++) {
    if (remainingBalance <= 0) break;

    // Variable rate ARM logic
    if (rateType === "variable" && month > varFixedYears * 12) {
      const elapsedSinceFixed = month - 1 - (varFixedYears * 12);
      if (elapsedSinceFixed % varPeriodicity === 0) {
        const adjustmentIndex = Math.floor(elapsedSinceFixed / varPeriodicity) + 1;
        currentRate = resolveVariableRateAtAdjustment(
          currentRate,
          interestRate,
          varMaxIncrease,
          varVolatility,
          varTrendScenario,
          month,
          adjustmentIndex,
          varRateMode,
          varManualRates,
        );
      }
    }

    const monthlyRate = (currentRate / 100) / 12;
    let payment = 0;
    const nRemaining = totalMonths - month + 1;

    if (monthlyRate === 0) {
      payment = remainingBalance / nRemaining;
    } else {
      payment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, nRemaining)) / (Math.pow(1 + monthlyRate, nRemaining) - 1);
    }

    payment = Math.min(remainingBalance + (remainingBalance * monthlyRate), payment);
    const interestPaid = remainingBalance * monthlyRate;
    let principalPaid = payment - interestPaid;

    if (month === totalMonths || principalPaid > remainingBalance) {
      principalPaid = remainingBalance;
      payment = principalPaid + interestPaid;
    }

    remainingBalance -= principalPaid;
    remainingBalance = Math.max(0, remainingBalance);

    totalInterestPaid += interestPaid;
    totalPrincipalPaid += principalPaid;

    rows.push({
      month,
      payment,
      principalPaid,
      interestPaid,
      remainingBalance,
      currentRate,
    });

    if (remainingBalance <= 0) break;
  }

  return {
    rows,
    totalPrincipalPaid,
    totalInterestPaid,
    totalPaid: totalPrincipalPaid + totalInterestPaid,
    durationMonths: rows.length
  };
}

/**
 * Calculates standard scenario rows with extra principal payments.
 */
export function calculateScenarioRows(details: LoanDetails, extraPayments: ExtraPayment[]): AmortizationSchedule {
  const assetCost = Number(details.assetCost) || 0;
  const downPayment = Number(details.downPayment) || 0;
  const interestRate = Number(details.interestRate) || 0;
  const years = Number(details.years) || 0;
  const months = Number(details.months) || 0;
  const rateType = details.rateType || "fixed";
  const varFixedYears = Number(details.varFixedYears) || 5;
  const varPeriodicity = Number(details.varPeriodicity) || 12;
  const varMaxIncrease = Number(details.varMaxIncrease) || 4.0;
  const varVolatility = Number(details.varVolatility) || 0.5;
  const varTrendScenario = details.varTrendScenario || "average";
  const varRateMode = details.varRateMode || "trend";
  const varManualRates = details.varManualRates || [];

  const principal = Math.max(100, assetCost - downPayment);
  const totalMonths = Math.min(480, Math.max(6, years * 12 + months));

  const baseline = calculateStandardRows(details);
  const baselinePaymentMap = new Map<number, number>();
  baseline.rows.forEach(r => {
    baselinePaymentMap.set(r.month, r.payment);
  });

  const rows: AmortizationRow[] = [];
  let remainingBalance = principal;
  let currentRate = interestRate;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let totalExtraPaid = 0;
  let requiredPayment = 0;

  for (let month = 1; month <= totalMonths; month++) {
    if (remainingBalance <= 0) break;

    // Check ARM adjustments
    if (rateType === "variable" && month > varFixedYears * 12) {
      const elapsedSinceFixed = month - 1 - (varFixedYears * 12);
      if (elapsedSinceFixed % varPeriodicity === 0) {
        const adjustmentIndex = Math.floor(elapsedSinceFixed / varPeriodicity) + 1;
        currentRate = resolveVariableRateAtAdjustment(
          currentRate,
          interestRate,
          varMaxIncrease,
          varVolatility,
          varTrendScenario,
          month,
          adjustmentIndex,
          varRateMode,
          varManualRates,
        );

        // Recalculate true required payment at adjustment dates
        const nRemaining = totalMonths - month + 1;
        const monthlyRate = (currentRate / 100) / 12;
        if (monthlyRate === 0) {
          requiredPayment = remainingBalance / nRemaining;
        } else {
          requiredPayment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, nRemaining)) / (Math.pow(1 + monthlyRate, nRemaining) - 1);
        }
      }
    }

    const monthlyRate = (currentRate / 100) / 12;

    let baseRequiredPayment = baselinePaymentMap.get(month) || 0;
    if (rateType === "variable" && month > varFixedYears * 12) {
      baseRequiredPayment = requiredPayment || baseRequiredPayment;
    }
    if (baseRequiredPayment === 0) {
      if (monthlyRate === 0) {
        baseRequiredPayment = remainingBalance / (totalMonths - month + 1);
      } else {
        const nRemaining = totalMonths - month + 1;
        baseRequiredPayment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, nRemaining)) / (Math.pow(1 + monthlyRate, nRemaining) - 1);
      }
    }

    const interestPaid = remainingBalance * monthlyRate;

    let regularPrincipalPaid = baseRequiredPayment - interestPaid;
    if (regularPrincipalPaid < 0) regularPrincipalPaid = 0;
    if (regularPrincipalPaid > remainingBalance) regularPrincipalPaid = remainingBalance;

    // Sum extra payments
    let extraPaymentAmount = 0;
    if (extraPayments && extraPayments.length > 0) {
      for (const ep of extraPayments) {
        if (ep.type === "single" && Number(ep.period) === month) {
          extraPaymentAmount += Number(ep.amount) || 0;
        } else if (ep.type === "recurring") {
          const start = Number(ep.startPeriod) || 1;
          const end = Number(ep.endPeriod) || totalMonths;
          if (month >= start && month <= end) {
            extraPaymentAmount += Number(ep.amount) || 0;
          }
        }
      }
    }

    let actualExtraPaid = extraPaymentAmount;
    if (regularPrincipalPaid + actualExtraPaid > remainingBalance) {
      actualExtraPaid = remainingBalance - regularPrincipalPaid;
      if (actualExtraPaid < 0) {
        actualExtraPaid = 0;
        regularPrincipalPaid = remainingBalance;
      }
    }

    const totalPrincipalPaidThisMonth = regularPrincipalPaid + actualExtraPaid;
    const actualTotalPaymentForMonth = interestPaid + totalPrincipalPaidThisMonth;

    remainingBalance -= totalPrincipalPaidThisMonth;
    remainingBalance = Math.max(0, remainingBalance);

    totalInterestPaid += interestPaid;
    totalPrincipalPaid += totalPrincipalPaidThisMonth;
    totalExtraPaid += actualExtraPaid;

    rows.push({
      month,
      payment: actualTotalPaymentForMonth,
      principalPaid: totalPrincipalPaidThisMonth,
      interestPaid,
      remainingBalance,
      extraPaymentPaid: actualExtraPaid,
      currentRate
    });

    if (remainingBalance <= 0) break;
  }

  return {
    rows,
    totalPrincipalPaid,
    totalInterestPaid,
    totalExtraPaid,
    totalPaid: totalPrincipalPaid + totalInterestPaid,
    durationMonths: rows.length
  };
}

/**
 * Deterministic simulation of ARM payments over time.
 */
export function generateVariableRateAmortization(
  principal: number,
  startRate: number,
  termYears: number,
  fixedYears: number,
  periodicityMonths: number,
  maxIncrease: number,
  volatility: number,
  trendScenario: "best" | "average" | "worst"
) {
  const totalMonths = termYears * 12;
  const rows = [];
  let remainingBalance = principal;
  let currentRate = startRate;
  const rateMode: VarRateMode = "trend";
  const manualRates: VariableRateAdjustmentEntry[] = [];

  for (let month = 1; month <= totalMonths; month++) {
    if (remainingBalance <= 0) break;

    // ARM rate adjustment trigger
    if (month > fixedYears * 12) {
      const elapsedSinceFixed = month - 1 - (fixedYears * 12);
      if (elapsedSinceFixed % periodicityMonths === 0) {
        const adjustmentIndex = Math.floor(elapsedSinceFixed / periodicityMonths) + 1;
        currentRate = resolveVariableRateAtAdjustment(
          currentRate,
          startRate,
          maxIncrease,
          volatility,
          trendScenario,
          month,
          adjustmentIndex,
          rateMode,
          manualRates,
        );
      }
    }

    const monthlyRate = (currentRate / 100) / 12;
    const nRemaining = totalMonths - month + 1;
    let payment = 0;

    if (monthlyRate === 0) {
      payment = remainingBalance / nRemaining;
    } else {
      payment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, nRemaining)) / (Math.pow(1 + monthlyRate, nRemaining) - 1);
    }

    payment = Math.min(remainingBalance + (remainingBalance * monthlyRate), payment);
    const interestPaid = remainingBalance * monthlyRate;
    let principalPaid = payment - interestPaid;

    if (month === totalMonths || principalPaid > remainingBalance) {
      principalPaid = remainingBalance;
      payment = principalPaid + interestPaid;
    }

    remainingBalance -= principalPaid;
    remainingBalance = Math.max(0, remainingBalance);

    rows.push({
      month,
      rate: currentRate,
      payment,
      interestPaid,
      principalPaid,
      remainingBalance
    });

    if (remainingBalance <= 0) break;
  }

  return rows;
}

/**
 * Monte Carlo simulator runs count trials of random walk variable rates.
 */
export function runMonteCarloSimulations(
  principal: number,
  startRate: number,
  termYears: number,
  fixedYears: number,
  periodicityMonths: number,
  maxIncrease: number,
  volatility: number,
  runsCount: number = 200
) {
  const totalMonths = termYears * 12;
  const results: number[] = [];

  for (let run = 0; run < runsCount; run++) {
    let remainingBalance = principal;
    let currentRate = startRate;
    let totalInterestPaid = 0;

    for (let month = 1; month <= totalMonths; month++) {
      if (remainingBalance <= 0) break;

      // Random adjustment step
      if (month > fixedYears * 12) {
        const elapsedSinceFixed = month - 1 - (fixedYears * 12);
        if (elapsedSinceFixed % periodicityMonths === 0) {
          const step = (Math.random() - 0.45) * 2 * volatility * 1.5;
          let potentialNewRate = currentRate + step;
          potentialNewRate = Math.max(1.0, Math.min(startRate + maxIncrease, potentialNewRate));
          currentRate = potentialNewRate;
        }
      }

      const monthlyRate = (currentRate / 100) / 12;
      const nRemaining = totalMonths - month + 1;
      let payment = 0;

      if (monthlyRate === 0) {
        payment = remainingBalance / nRemaining;
      } else {
        payment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, nRemaining)) / (Math.pow(1 + monthlyRate, nRemaining) - 1);
      }

      payment = Math.min(remainingBalance + (remainingBalance * monthlyRate), payment);
      const interestPaid = remainingBalance * monthlyRate;
      let principalPaid = payment - interestPaid;

      if (month === totalMonths || principalPaid > remainingBalance) {
        principalPaid = remainingBalance;
        payment = principalPaid + interestPaid;
      }

      totalInterestPaid += interestPaid;
      remainingBalance -= principalPaid;
      remainingBalance = Math.max(0, remainingBalance);
    }

    results.push(totalInterestPaid);
  }

  return results.sort((a, b) => a - b);
}

/**
 * Calculates borrowing capacity based on interest rate, hold payment target, and duration.
 */
export function calculateBorrowingCapacity(targetPayment: number, years: number, rateAnnual: number): number {
  const n = years * 12;
  const rMonthly = (rateAnnual / 100) / 12;
  if (rMonthly === 0) {
    return targetPayment * n;
  }
  const maxPrincipal = targetPayment * (1 - Math.pow(1 + rMonthly, -n)) / rMonthly;
  return maxPrincipal;
}

/**
 * Calculates required monthly payment for fixed rate elements.
 */
export function calculateRecurringFixedPayment(principal: number, years: number, rateAnnual: number): number {
  const n = years * 12;
  const rMonthly = (rateAnnual / 100) / 12;
  if (rMonthly === 0) {
    return principal / n;
  }
  const pmt = principal * (rMonthly * Math.pow(1 + rMonthly, n)) / (Math.pow(1 + rMonthly, n) - 1);
  return pmt;
}
