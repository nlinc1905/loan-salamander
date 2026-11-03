import { describe, expect, it } from "vitest";
import { calculateScenarioRows, calculateStandardRows } from "./calculations";

describe("calculateStandardRows", () => {
  it("uses manual adjustment rates when available and projects later adjustments when entries are missing", () => {
    const schedule = calculateStandardRows({
      assetCost: 100000,
      downPayment: 0,
      interestRate: 5,
      years: 30,
      months: 0,
      rateType: "variable",
      varFixedYears: 5,
      varPeriodicity: 12,
      varMaxIncrease: 4,
      varVolatility: 0.5,
      varTrendScenario: "worst",
      varRateMode: "manual",
      varManualRates: [
        { adjustmentIndex: 1, rate: 6.5 },
      ],
    });

    const firstAdjustmentRow = schedule.rows.find((row) => row.month === 61);
    const secondAdjustmentRow = schedule.rows.find((row) => row.month === 73);

    expect(firstAdjustmentRow?.currentRate).toBe(6.5);
    expect(secondAdjustmentRow?.currentRate).toBeGreaterThan(6.5);
  });

  it("applies manual-rate overrides in scenario rows while still honoring extra payments", () => {
    const scenario = calculateScenarioRows({
      assetCost: 100000,
      downPayment: 0,
      interestRate: 5,
      years: 30,
      months: 0,
      rateType: "variable",
      varFixedYears: 5,
      varPeriodicity: 12,
      varMaxIncrease: 4,
      varVolatility: 0.5,
      varTrendScenario: "worst",
      varRateMode: "manual",
      varManualRates: [
        { adjustmentIndex: 1, rate: 6.5 },
      ],
    }, [{ id: "extra-1", type: "single", amount: 100, period: 1, startPeriod: 1, endPeriod: 1 }]);

    const firstAdjustmentRow = scenario.rows.find((row) => row.month === 61);
    const firstMonthRow = scenario.rows.find((row) => row.month === 1);

    expect(firstAdjustmentRow?.currentRate).toBe(6.5);
    expect(firstMonthRow?.extraPaymentPaid).toBe(100);
  });
});
