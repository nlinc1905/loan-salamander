export type LoanType = "mortgage" | "school" | "auto" | "other";
export type RateType = "fixed" | "variable";

export interface User {
  id: string;
  email: string;
  isPremium: boolean;
  premiumUntil: string | null; // ISO Date/Timestamp
  token?: string;
}

export interface LoanParams {
  principal: number;
  downPayment: number;
  interestRate: number; // e.g., 5.5 means 5.5%
  durationMonths: number; // 6 to 480 (40 years)
  loanType: LoanType;
  rateType: RateType;
  // For variable rates:
  variableFrequencyMonths?: number; // how often rate adjusting
  variableMaxIncrease?: number; // max percentage rate can go up
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  currentRate: number;
}

export interface AmortizationSchedule {
  rows: AmortizationRow[];
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalPaid: number;
  monthlyPayment: number; // Initial or standard monthly payment
}

export type ConstantVariable = "principal" | "interestRate" | "monthlyPayment";
