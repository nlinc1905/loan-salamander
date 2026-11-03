import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, RefreshCw, CalendarDays, TrendingDown, Wallet, TrendingUp, Info, Download } from "lucide-react";
import PlotlyChart from "./PlotlyChart";

type RateType = "fixed" | "variable";
type VarTrendScenario = "best" | "average" | "worst";
type CurrentPositionInputMode = "principal" | "term";
type NewLoanAmountMode = "current-principal" | "different-amount";

interface LoanOption {
  id: string;
  name: string;
  assetCost: number;
  downPayment: number;
  interestRate: number;
  years: number;
  months: number;
  loanType: string;
  rateType: string;
  varFixedYears?: number;
  varPeriodicity?: number;
  varMaxIncrease?: number;
  varVolatility?: number;
  varTrendScenario?: VarTrendScenario;
  varRateMode?: "trend" | "manual";
  varManualRates?: Array<{ adjustmentIndex: number; rate: number }>;
}

interface AmortizationResult {
  durationMonths: number;
  monthlyPayment: number;
  maxMonthlyPayment: number;
  totalInterest: number;
  monthlyRates: number[];
  monthlyPayments: number[];
  cumulativePrincipal: number[];
  remainingPrincipal: number[];
  cumulativeInterest: number[];
  cumulativePayments: number[];
}

interface VariableRateConfig {
  rateType: RateType;
  varFixedYears: number;
  varPeriodicity: number;
  varMaxIncrease: number;
  varVolatility: number;
  varTrendScenario: VarTrendScenario;
  varRateMode: "trend" | "manual";
  varManualRates: Array<{ adjustmentIndex: number; rate: number }>;
}

interface AgentSetInputEventDetail {
  page?: string;
  state?: Record<string, unknown>;
}

function toCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${toCurrency(value)}`;
}

function buildAmortization(
  principal: number,
  annualRate: number,
  months: number,
  variableConfig: VariableRateConfig,
): AmortizationResult {
  if (principal <= 0 || months <= 0) {
    return {
      durationMonths: 0,
      monthlyPayment: 0,
      maxMonthlyPayment: 0,
      totalInterest: 0,
      monthlyRates: [],
      monthlyPayments: [],
      cumulativePrincipal: [],
      remainingPrincipal: [],
      cumulativeInterest: [],
      cumulativePayments: [],
    };
  }

  let remaining = principal;
  let currentRate = annualRate;
  let principalSoFar = 0;
  let interestSoFar = 0;
  let paymentsSoFar = 0;
  let maxMonthlyPayment = 0;

  const cumulativePrincipal: number[] = [];
  const remainingPrincipal: number[] = [];
  const cumulativeInterest: number[] = [];
  const cumulativePayments: number[] = [];
  const monthlyRates: number[] = [];
  const monthlyPayments: number[] = [];

  for (let month = 1; month <= months; month += 1) {
    if (remaining <= 0) {
      break;
    }

    if (variableConfig.rateType === "variable" && month > variableConfig.varFixedYears * 12) {
      const elapsedSinceFixed = month - 1 - (variableConfig.varFixedYears * 12);
      if (elapsedSinceFixed % variableConfig.varPeriodicity === 0) {
        const adjustmentIndex = Math.floor(elapsedSinceFixed / variableConfig.varPeriodicity) + 1;
        const manualEntry = variableConfig.varManualRates.find((entry) => entry.adjustmentIndex === adjustmentIndex);
        if (variableConfig.varRateMode === "manual" && manualEntry && Number.isFinite(manualEntry.rate)) {
          currentRate = Math.max(1.0, Math.min(annualRate + variableConfig.varMaxIncrease, Number(manualEntry.rate)));
        } else if (variableConfig.varTrendScenario === "average") {
          const changeMagnitude = (Math.sin(month / 12) * variableConfig.varVolatility * 1.5) + (0.1 * variableConfig.varVolatility);
          let potentialNewRate = currentRate + changeMagnitude;
          potentialNewRate = Math.max(1.0, Math.min(annualRate + variableConfig.varMaxIncrease, potentialNewRate));
          currentRate = potentialNewRate;
        } else if (variableConfig.varTrendScenario === "worst") {
          let potentialNewRate = currentRate + variableConfig.varVolatility;
          potentialNewRate = Math.max(1.0, Math.min(annualRate + variableConfig.varMaxIncrease, potentialNewRate));
          currentRate = potentialNewRate;
        } else {
          let potentialNewRate = currentRate - variableConfig.varVolatility;
          potentialNewRate = Math.max(1.0, Math.min(annualRate + variableConfig.varMaxIncrease, potentialNewRate));
          currentRate = potentialNewRate;
        }
      }
    }

    const monthlyRate = currentRate / 100 / 12;
    const nRemaining = months - month + 1;

    let payment = 0;
    if (monthlyRate === 0) {
      payment = remaining / nRemaining;
    } else {
      const factor = Math.pow(1 + monthlyRate, nRemaining);
      payment = remaining * ((monthlyRate * factor) / (factor - 1));
    }

    const interestPaid = remaining * monthlyRate;
    let principalPaid = payment - interestPaid;

    if (principalPaid > remaining || month === months) {
      principalPaid = remaining;
    }

    const paymentForMonth = principalPaid + interestPaid;
    maxMonthlyPayment = Math.max(maxMonthlyPayment, paymentForMonth);

    remaining = Math.max(0, remaining - principalPaid);
    principalSoFar += principalPaid;
    interestSoFar += interestPaid;
    paymentsSoFar += paymentForMonth;

    cumulativePrincipal.push(principalSoFar);
    remainingPrincipal.push(remaining);
    cumulativeInterest.push(interestSoFar);
    cumulativePayments.push(paymentsSoFar);
    monthlyRates.push(currentRate);
    monthlyPayments.push(paymentForMonth);
  }

  return {
    durationMonths: cumulativePayments.length,
    monthlyPayment: monthlyPayments.length > 0 ? monthlyPayments[0] : 0,
    maxMonthlyPayment,
    totalInterest: interestSoFar,
    monthlyRates,
    monthlyPayments,
    cumulativePrincipal,
    remainingPrincipal,
    cumulativeInterest,
    cumulativePayments,
  };
}

function getARMReadableString(varFixedYears: number, varPeriodicity: number): string {
  const adjustText = varPeriodicity === 6 ? "6 months" : varPeriodicity === 12 ? "year" : "2 years";
  const armTermText = varPeriodicity === 6 ? "0.5" : varPeriodicity === 12 ? "1" : "2";
  return `Fixed for ${varFixedYears} years, followed by adjustments every ${adjustText} (ARM ${varFixedYears}/${armTermText})`;
}

function findClosestElapsedMonthByRemainingPrincipal(originalPrincipal: number, fullSchedule: AmortizationResult, targetPrincipal: number): number {
  const remainingPath = [originalPrincipal, ...fullSchedule.remainingPrincipal];
  let bestMonth = 0;
  let bestDiff = Math.abs(remainingPath[0] - targetPrincipal);

  for (let idx = 1; idx < remainingPath.length; idx += 1) {
    const diff = Math.abs(remainingPath[idx] - targetPrincipal);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestMonth = idx;
    }
  }

  return bestMonth;
}

function sliceFutureSchedule(fullSchedule: AmortizationResult, elapsedMonths: number): AmortizationResult {
  if (elapsedMonths <= 0) {
    return fullSchedule;
  }

  if (elapsedMonths >= fullSchedule.durationMonths) {
    return {
      durationMonths: 0,
      monthlyPayment: 0,
      maxMonthlyPayment: 0,
      totalInterest: 0,
      monthlyRates: [],
      monthlyPayments: [],
      cumulativePrincipal: [],
      remainingPrincipal: [],
      cumulativeInterest: [],
      cumulativePayments: [],
    };
  }

  const principalPaidPast = fullSchedule.cumulativePrincipal[elapsedMonths - 1] ?? 0;
  const interestPaidPast = fullSchedule.cumulativeInterest[elapsedMonths - 1] ?? 0;
  const paymentsPast = fullSchedule.cumulativePayments[elapsedMonths - 1] ?? 0;

  const monthlyPayments = fullSchedule.monthlyPayments.slice(elapsedMonths);
  const monthlyRates = fullSchedule.monthlyRates.slice(elapsedMonths);
  const cumulativePrincipal = fullSchedule.cumulativePrincipal
    .slice(elapsedMonths)
    .map((value) => value - principalPaidPast);
  const remainingPrincipal = fullSchedule.remainingPrincipal.slice(elapsedMonths);
  const cumulativeInterest = fullSchedule.cumulativeInterest
    .slice(elapsedMonths)
    .map((value) => value - interestPaidPast);
  const cumulativePayments = fullSchedule.cumulativePayments
    .slice(elapsedMonths)
    .map((value) => value - paymentsPast);

  return {
    durationMonths: monthlyPayments.length,
    monthlyPayment: monthlyPayments.length > 0 ? monthlyPayments[0] : 0,
    maxMonthlyPayment: monthlyPayments.length > 0 ? Math.max(...monthlyPayments) : 0,
    totalInterest: cumulativeInterest.length > 0 ? cumulativeInterest[cumulativeInterest.length - 1] : 0,
    monthlyRates,
    monthlyPayments,
    cumulativePrincipal,
    remainingPrincipal,
    cumulativeInterest,
    cumulativePayments,
  };
}

export default function RefinancePage() {
  const [savedLoans, setSavedLoans] = useState<LoanOption[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);

  const [currentOriginalAmount, setCurrentOriginalAmount] = useState(300000);
  const [currentOriginalTermYears, setCurrentOriginalTermYears] = useState(30);
  const [currentOriginalTermMonths, setCurrentOriginalTermMonths] = useState(0);
  const [currentPositionInputMode, setCurrentPositionInputMode] = useState<CurrentPositionInputMode>("principal");
  const [currentPrincipalRemainingInput, setCurrentPrincipalRemainingInput] = useState(250000);
  const [currentElapsedYearsInput, setCurrentElapsedYearsInput] = useState(0);
  const [currentElapsedMonthsInput, setCurrentElapsedMonthsInput] = useState(0);
  const [currentRate, setCurrentRate] = useState(6.25);
  const [currentRateType, setCurrentRateType] = useState<RateType>("fixed");
  const [currentVarFixedYears, setCurrentVarFixedYears] = useState(5);
  const [currentVarPeriodicity, setCurrentVarPeriodicity] = useState(12);
  const [currentVarMaxIncrease, setCurrentVarMaxIncrease] = useState(4);
  const [currentVarVolatility, setCurrentVarVolatility] = useState(0.5);
  const [currentVarTrendScenario, setCurrentVarTrendScenario] = useState<VarTrendScenario>("average");
  const [currentVarRateMode, setCurrentVarRateMode] = useState<"trend" | "manual">("trend");
  const [currentVarManualRates, setCurrentVarManualRates] = useState<Array<{ adjustmentIndex: number; rate: number }>>([]);
  const [upfrontCost, setUpfrontCost] = useState(5000);
  const [cashOut, setCashOut] = useState(0);

  const [newPrincipal, setNewPrincipal] = useState(300000);
  const [newTermYears, setNewTermYears] = useState(30);
  const [newTermMonths, setNewTermMonths] = useState(0);
  const [newLoanAmountMode, setNewLoanAmountMode] = useState<NewLoanAmountMode>("current-principal");
  const [newRate, setNewRate] = useState(5.5);
  const [newRateType, setNewRateType] = useState<RateType>("fixed");
  const [newVarFixedYears, setNewVarFixedYears] = useState(5);
  const [newVarPeriodicity, setNewVarPeriodicity] = useState(12);
  const [newVarMaxIncrease, setNewVarMaxIncrease] = useState(4);
  const [newVarVolatility, setNewVarVolatility] = useState(0.5);
  const [newVarTrendScenario, setNewVarTrendScenario] = useState<VarTrendScenario>("average");
  const [newVarRateMode, setNewVarRateMode] = useState<"trend" | "manual">("trend");
  const [newVarManualRates, setNewVarManualRates] = useState<Array<{ adjustmentIndex: number; rate: number }>>([]);
  const outputsRef = useRef<Record<string, unknown>>({
    charts: {},
    summary: {},
  });

  // Listen for input events from the agent to update the component state. This effect sets up a handler
  // for the "agent:setInput" event and updates the relevant state values when the event is received.
  useEffect(() => {
    const toNumber = (value: unknown): number | null => {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === "string" && value.trim() !== "") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const handleSetInputEvent = (event: Event) => {
      const detail = (event as CustomEvent<AgentSetInputEventDetail>).detail;
      if (!detail || detail.page !== "refinance" || !detail.state || typeof detail.state !== "object") {
        return;
      }

      const state = detail.state;

      if (typeof state.selectedLoanId === "string") {
        setSelectedLoanId(state.selectedLoanId);
      }

      const currentOriginalAmountValue = toNumber(state.currentOriginalAmount);
      if (currentOriginalAmountValue !== null) setCurrentOriginalAmount(Math.max(0, currentOriginalAmountValue));

      const currentOriginalTermYearsValue = toNumber(state.currentOriginalTermYears);
      if (currentOriginalTermYearsValue !== null) setCurrentOriginalTermYears(Math.max(0, Math.trunc(currentOriginalTermYearsValue)));

      const currentOriginalTermMonthsValue = toNumber(state.currentOriginalTermMonths);
      if (currentOriginalTermMonthsValue !== null) setCurrentOriginalTermMonths(Math.max(0, Math.trunc(currentOriginalTermMonthsValue)));

      if (typeof state.currentPositionInputMode === "string" && ["principal", "term"].includes(state.currentPositionInputMode)) {
        setCurrentPositionInputMode(state.currentPositionInputMode as CurrentPositionInputMode);
      }

      const currentPrincipalRemainingInputValue = toNumber(state.currentPrincipalRemainingInput);
      if (currentPrincipalRemainingInputValue !== null) setCurrentPrincipalRemainingInput(Math.max(0, currentPrincipalRemainingInputValue));

      const currentElapsedYearsInputValue = toNumber(state.currentElapsedYearsInput);
      if (currentElapsedYearsInputValue !== null) setCurrentElapsedYearsInput(Math.max(0, Math.trunc(currentElapsedYearsInputValue)));

      const currentElapsedMonthsInputValue = toNumber(state.currentElapsedMonthsInput);
      if (currentElapsedMonthsInputValue !== null) setCurrentElapsedMonthsInput(Math.max(0, Math.trunc(currentElapsedMonthsInputValue)));

      const currentRateValue = toNumber(state.currentRate);
      if (currentRateValue !== null) setCurrentRate(Math.max(0, currentRateValue));

      if (typeof state.currentRateType === "string" && ["fixed", "variable"].includes(state.currentRateType)) {
        setCurrentRateType(state.currentRateType as RateType);
      }

      const currentVarFixedYearsValue = toNumber(state.currentVarFixedYears);
      if (currentVarFixedYearsValue !== null && [3, 5, 7, 10].includes(Math.trunc(currentVarFixedYearsValue))) {
        setCurrentVarFixedYears(Math.trunc(currentVarFixedYearsValue));
      }

      const currentVarPeriodicityValue = toNumber(state.currentVarPeriodicity);
      if (currentVarPeriodicityValue !== null && [6, 12, 24].includes(Math.trunc(currentVarPeriodicityValue))) {
        setCurrentVarPeriodicity(Math.trunc(currentVarPeriodicityValue));
      }

      const currentVarMaxIncreaseValue = toNumber(state.currentVarMaxIncrease);
      if (currentVarMaxIncreaseValue !== null) setCurrentVarMaxIncrease(Math.max(0, currentVarMaxIncreaseValue));

      const currentVarVolatilityValue = toNumber(state.currentVarVolatility);
      if (currentVarVolatilityValue !== null) setCurrentVarVolatility(Math.max(0, currentVarVolatilityValue));

      if (typeof state.currentVarTrendScenario === "string" && ["best", "average", "worst"].includes(state.currentVarTrendScenario)) {
        setCurrentVarTrendScenario(state.currentVarTrendScenario as VarTrendScenario);
      }

      if (typeof state.currentVarRateMode === "string" && ["trend", "manual"].includes(state.currentVarRateMode)) {
        setCurrentVarRateMode(state.currentVarRateMode as "trend" | "manual");
      }

      if (Array.isArray(state.currentVarManualRates)) {
        setCurrentVarManualRates(state.currentVarManualRates as Array<{ adjustmentIndex: number; rate: number }>);
      }

      const upfrontCostValue = toNumber(state.upfrontCost);
      if (upfrontCostValue !== null) setUpfrontCost(Math.max(0, upfrontCostValue));

      const cashOutValue = toNumber(state.cashOut);
      if (cashOutValue !== null) setCashOut(Math.max(0, cashOutValue));

      const newPrincipalValue = toNumber(state.newPrincipal);
      if (newPrincipalValue !== null) setNewPrincipal(Math.max(0, newPrincipalValue));

      if (typeof state.newLoanAmountMode === "string" && ["current-principal", "different-amount"].includes(state.newLoanAmountMode)) {
        setNewLoanAmountMode(state.newLoanAmountMode as NewLoanAmountMode);
      }

      const newTermYearsValue = toNumber(state.newTermYears);
      if (newTermYearsValue !== null) setNewTermYears(Math.max(0, Math.trunc(newTermYearsValue)));

      const newTermMonthsValue = toNumber(state.newTermMonths);
      if (newTermMonthsValue !== null) setNewTermMonths(Math.max(0, Math.trunc(newTermMonthsValue)));

      const newRateValue = toNumber(state.newRate);
      if (newRateValue !== null) setNewRate(Math.max(0, newRateValue));

      if (typeof state.newRateType === "string" && ["fixed", "variable"].includes(state.newRateType)) {
        setNewRateType(state.newRateType as RateType);
      }

      const newVarFixedYearsValue = toNumber(state.newVarFixedYears);
      if (newVarFixedYearsValue !== null && [3, 5, 7, 10].includes(Math.trunc(newVarFixedYearsValue))) {
        setNewVarFixedYears(Math.trunc(newVarFixedYearsValue));
      }

      const newVarPeriodicityValue = toNumber(state.newVarPeriodicity);
      if (newVarPeriodicityValue !== null && [6, 12, 24].includes(Math.trunc(newVarPeriodicityValue))) {
        setNewVarPeriodicity(Math.trunc(newVarPeriodicityValue));
      }

      const newVarMaxIncreaseValue = toNumber(state.newVarMaxIncrease);
      if (newVarMaxIncreaseValue !== null) setNewVarMaxIncrease(Math.max(0, newVarMaxIncreaseValue));

      const newVarVolatilityValue = toNumber(state.newVarVolatility);
      if (newVarVolatilityValue !== null) setNewVarVolatility(Math.max(0, newVarVolatilityValue));

      if (typeof state.newVarTrendScenario === "string" && ["best", "average", "worst"].includes(state.newVarTrendScenario)) {
        setNewVarTrendScenario(state.newVarTrendScenario as VarTrendScenario);
      }

      if (typeof state.newVarRateMode === "string" && ["trend", "manual"].includes(state.newVarRateMode)) {
        setNewVarRateMode(state.newVarRateMode as "trend" | "manual");
      }

      if (Array.isArray(state.newVarManualRates)) {
        setNewVarManualRates(state.newVarManualRates as Array<{ adjustmentIndex: number; rate: number }>);
      }
    };

    window.addEventListener("agent:set_input", handleSetInputEvent as EventListener);
    return () => {
      window.removeEventListener("agent:set_input", handleSetInputEvent as EventListener);
    };
  }, []);

  useEffect(() => {
    const loadLoans = async () => {
      setIsLoadingLoans(true);
      try {
        const response = await fetch("/api/loans");
        const data = await response.json();
        if (!response.ok || !data?.success || !Array.isArray(data.loans)) {
          setSavedLoans([]);
          return;
        }

        const loans = data.loans as LoanOption[];
        setSavedLoans(loans);
        if (loans.length > 0) {
          const defaultLoan = loans.find((loan) => loan.id !== "loan_standard_demo") || loans[0];
          setSelectedLoanId(defaultLoan.id);
        }
      } catch {
        setSavedLoans([]);
      } finally {
        setIsLoadingLoans(false);
      }
    };

    void loadLoans();
  }, []);

  useEffect(() => {
    if (!selectedLoanId) {
      return;
    }

    const selected = savedLoans.find((loan) => loan.id === selectedLoanId);
    if (!selected) {
      return;
    }

    const inferredOriginalAmount = Math.max(0, selected.assetCost - selected.downPayment);
    const inferredOriginalMonths = Math.max(1, selected.years * 12 + selected.months);

    setCurrentOriginalAmount(inferredOriginalAmount);
    setCurrentOriginalTermYears(Math.floor(inferredOriginalMonths / 12));
    setCurrentOriginalTermMonths(inferredOriginalMonths % 12);
    setCurrentPrincipalRemainingInput(inferredOriginalAmount);
    setCurrentElapsedYearsInput(0);
    setCurrentElapsedMonthsInput(0);
    setCurrentRate(Math.max(0, selected.interestRate));
    setCurrentRateType(selected.rateType === "variable" ? "variable" : "fixed");
    setCurrentVarFixedYears(selected.varFixedYears ?? 5);
    setCurrentVarPeriodicity(selected.varPeriodicity ?? 12);
    setCurrentVarMaxIncrease(selected.varMaxIncrease ?? 4);
    setCurrentVarVolatility(selected.varVolatility ?? 0.5);
    setCurrentVarTrendScenario(selected.varTrendScenario ?? "average");
    setCurrentVarRateMode(selected.varRateMode ?? "trend");
    setCurrentVarManualRates(selected.varManualRates ?? []);

    setNewPrincipal(inferredOriginalAmount);
    setNewTermYears(Math.floor(inferredOriginalMonths / 12));
    setNewTermMonths(inferredOriginalMonths % 12);
    setNewRate(Math.max(0, selected.interestRate));
    setNewRateType(selected.rateType === "variable" ? "variable" : "fixed");
    setNewVarFixedYears(selected.varFixedYears ?? 5);
    setNewVarPeriodicity(selected.varPeriodicity ?? 12);
    setNewVarMaxIncrease(selected.varMaxIncrease ?? 4);
    setNewVarVolatility(selected.varVolatility ?? 0.5);
    setNewVarTrendScenario(selected.varTrendScenario ?? "average");
    setNewVarRateMode(selected.varRateMode ?? "trend");
    setNewVarManualRates(selected.varManualRates ?? []);
  }, [selectedLoanId, savedLoans]);

  const currentVariableConfig = useMemo<VariableRateConfig>(() => ({
    rateType: currentRateType,
    varFixedYears: currentVarFixedYears,
    varPeriodicity: currentVarPeriodicity,
    varMaxIncrease: currentVarMaxIncrease,
    varVolatility: currentVarVolatility,
    varTrendScenario: currentVarTrendScenario,
    varRateMode: currentVarRateMode,
    varManualRates: currentVarManualRates,
  }), [
    currentRateType,
    currentVarFixedYears,
    currentVarPeriodicity,
    currentVarMaxIncrease,
    currentVarVolatility,
    currentVarTrendScenario,
    currentVarRateMode,
    currentVarManualRates,
  ]);

  const newVariableConfig = useMemo<VariableRateConfig>(() => ({
    rateType: newRateType,
    varFixedYears: newVarFixedYears,
    varPeriodicity: newVarPeriodicity,
    varMaxIncrease: newVarMaxIncrease,
    varVolatility: newVarVolatility,
    varTrendScenario: newVarTrendScenario,
    varRateMode: newVarRateMode,
    varManualRates: newVarManualRates,
  }), [
    newRateType,
    newVarFixedYears,
    newVarPeriodicity,
    newVarMaxIncrease,
    newVarVolatility,
    newVarTrendScenario,
    newVarRateMode,
    newVarManualRates,
  ]);

  const currentOriginalTotalMonths = Math.max(1, (Math.max(0, currentOriginalTermYears) * 12) + Math.max(0, currentOriginalTermMonths));
  const newTotalMonths = Math.max(1, (Math.max(0, newTermYears) * 12) + Math.max(0, newTermMonths));

  const currentFullSchedule = useMemo(
    () => buildAmortization(currentOriginalAmount, currentRate, currentOriginalTotalMonths, currentVariableConfig),
    [currentOriginalAmount, currentRate, currentOriginalTotalMonths, currentVariableConfig],
  );

  const adjustmentCount = Math.max(0, Math.floor(Math.max(0, currentOriginalTotalMonths - currentVarFixedYears * 12) / currentVarPeriodicity));
  const newAdjustmentCount = Math.max(0, Math.floor(Math.max(0, newTotalMonths - newVarFixedYears * 12) / newVarPeriodicity));

  useEffect(() => {
    setCurrentVarManualRates((entries) => {
      const nextEntries = [...entries];
      const normalizedEntries: Array<{ adjustmentIndex: number; rate: number }> = [];
      for (let idx = 1; idx <= adjustmentCount; idx += 1) {
        const existing = nextEntries.find((entry) => entry.adjustmentIndex === idx);
        if (existing) {
          normalizedEntries.push(existing);
        }
      }
      return normalizedEntries;
    });
  }, [adjustmentCount]);

  useEffect(() => {
    setNewVarManualRates((entries) => {
      const nextEntries = [...entries];
      const normalizedEntries: Array<{ adjustmentIndex: number; rate: number }> = [];
      for (let idx = 1; idx <= newAdjustmentCount; idx += 1) {
        const existing = nextEntries.find((entry) => entry.adjustmentIndex === idx);
        if (existing) {
          normalizedEntries.push(existing);
        }
      }
      return normalizedEntries;
    });
  }, [newAdjustmentCount]);

  const currentPositionContext = useMemo(() => {
    const normalizedYears = Math.min(Math.max(0, currentElapsedYearsInput), Math.max(0, currentOriginalTermYears));
    const enteredElapsedMonthsRaw = (normalizedYears * 12) + Math.max(0, currentElapsedMonthsInput);
    const enteredElapsedMonths = Math.min(currentOriginalTotalMonths, enteredElapsedMonthsRaw);
    const hasPrincipalInput = currentPrincipalRemainingInput > 0;
    const hasElapsedInput = enteredElapsedMonths > 0;

    if (currentPositionInputMode === "principal") {
      if (!hasPrincipalInput) {
        return {
          elapsedMonths: 0,
          source: "none" as const,
          hasInput: false,
        };
      }

      const elapsedMonthsByPrincipal = findClosestElapsedMonthByRemainingPrincipal(
        currentOriginalAmount,
        currentFullSchedule,
        currentPrincipalRemainingInput,
      );
      return {
        elapsedMonths: elapsedMonthsByPrincipal,
        source: "principal" as const,
        hasInput: true,
      };
    }

    if (!hasElapsedInput) {
      return {
        elapsedMonths: 0,
        source: "none" as const,
        hasInput: false,
      };
    }

    return {
      elapsedMonths: enteredElapsedMonths,
      source: "term" as const,
      hasInput: true,
    };
  }, [
    currentPositionInputMode,
    currentElapsedMonthsInput,
    currentElapsedYearsInput,
    currentFullSchedule,
    currentOriginalAmount,
    currentOriginalTotalMonths,
    currentPrincipalRemainingInput,
  ]);

  const currentFutureSchedule = useMemo(
    () => sliceFutureSchedule(currentFullSchedule, currentPositionContext.elapsedMonths),
    [currentFullSchedule, currentPositionContext.elapsedMonths],
  );

  const currentPrincipalRemaining = useMemo(() => {
    if (currentPositionContext.elapsedMonths <= 0) {
      return currentOriginalAmount;
    }

    return currentFullSchedule.remainingPrincipal[currentPositionContext.elapsedMonths - 1] ?? currentOriginalAmount;
  }, [currentFullSchedule, currentOriginalAmount, currentPositionContext.elapsedMonths]);

  useEffect(() => {
    if (newLoanAmountMode === "current-principal") {
      setNewPrincipal(Math.max(0, currentPrincipalRemaining));
    }
  }, [currentPrincipalRemaining, newLoanAmountMode]);

  const newSchedule = useMemo(
    () => buildAmortization(newPrincipal, newRate, newTotalMonths, newVariableConfig),
    [newPrincipal, newRate, newTotalMonths, newVariableConfig],
  );

  const paymentDelta = newSchedule.maxMonthlyPayment - currentFutureSchedule.maxMonthlyPayment;
  const termDeltaMonths = newSchedule.durationMonths - currentFutureSchedule.durationMonths;
  const interestDelta = newSchedule.totalInterest - currentFutureSchedule.totalInterest;

  const maxTimelineMonths = Math.max(currentFutureSchedule.durationMonths, newSchedule.durationMonths, 1);
  const monthAxis = Array.from({ length: maxTimelineMonths }, (_, idx) => idx + 1);
  const loanPeriodLabels = monthAxis.map((month) => `Year ${Math.floor((month - 1) / 12) + 1}, Month ${((month - 1) % 12) + 1}`);
  const tickStep = Math.max(1, Math.ceil(loanPeriodLabels.length / 8));
  const xTickVals = loanPeriodLabels.filter((_, idx) => idx % tickStep === 0 || idx === loanPeriodLabels.length - 1);
  const xTickText = xTickVals.map((label) => label.replace(", Month ", ",<br>Month "));

  const fillToTimeline = (series: number[]): number[] => {
    if (series.length === 0) {
      return monthAxis.map(() => 0);
    }

    const lastValue = series[series.length - 1];
    return monthAxis.map((_, idx) => (idx < series.length ? series[idx] : lastValue));
  };

  const fillToTimelineWithFallback = (series: number[], fallbackValue: number): number[] => {
    if (series.length === 0) {
      return monthAxis.map(() => fallbackValue);
    }

    const lastValue = series[series.length - 1];
    return monthAxis.map((_, idx) => (idx < series.length ? series[idx] : lastValue));
  };

  const fillToTimelineWithZero = (series: number[]): number[] => {
    return monthAxis.map((_, idx) => (idx < series.length ? series[idx] : 0));
  };

  const currentPrincipalPaidAtCurrentPeriod = currentPositionContext.elapsedMonths > 0
    ? (currentFullSchedule.cumulativePrincipal[currentPositionContext.elapsedMonths - 1] ?? 0)
    : 0;
  const currentInterestPaidAtCurrentPeriod = currentPositionContext.elapsedMonths > 0
    ? (currentFullSchedule.cumulativeInterest[currentPositionContext.elapsedMonths - 1] ?? 0)
    : 0;

  const currentCumulativePrincipal = fillToTimelineWithFallback(
    currentFutureSchedule.cumulativePrincipal.map((value) => value + currentPrincipalPaidAtCurrentPeriod),
    currentPrincipalPaidAtCurrentPeriod,
  );
  const newCumulativePrincipal = fillToTimeline(newSchedule.cumulativePrincipal);
  const currentRemainingPrincipal = fillToTimeline(currentFutureSchedule.remainingPrincipal);
  const newRemainingPrincipal = fillToTimeline(newSchedule.remainingPrincipal);
  const currentCumulativeInterest = fillToTimelineWithFallback(
    currentFutureSchedule.cumulativeInterest.map((value) => value + currentInterestPaidAtCurrentPeriod),
    currentInterestPaidAtCurrentPeriod,
  );
  const newCumulativeInterest = fillToTimeline(newSchedule.cumulativeInterest);

  const currentCumulativePayments = fillToTimeline(currentFutureSchedule.cumulativePayments);
  const newCumulativePaymentsWithUpfront = fillToTimeline(newSchedule.cumulativePayments).map((value) => value + upfrontCost);

  const currentMonthlyPayments = fillToTimelineWithZero(currentFutureSchedule.monthlyPayments);
  const newMonthlyPayments = fillToTimelineWithZero(newSchedule.monthlyPayments);

  let breakEvenMonth: number | null = null;
  for (let idx = 0; idx < monthAxis.length; idx += 1) {
    if (newCumulativePaymentsWithUpfront[idx] <= currentCumulativePayments[idx]) {
      breakEvenMonth = idx + 1;
      break;
    }
  }

  const breakEvenLevel = breakEvenMonth ? currentCumulativePayments[breakEvenMonth - 1] : null;

  const amortizationChartData = [
    {
      x: loanPeriodLabels,
      y: currentCumulativePrincipal,
      type: "scatter",
      mode: "lines",
      name: "Current Loan (Remaining)<br>Cumulative Principal Paid",
      line: { color: "#4f5d75", width: 2 },
    },
    {
      x: loanPeriodLabels,
      y: newCumulativePrincipal,
      type: "scatter",
      mode: "lines",
      name: "New Loan<br>Cumulative Principal Paid",
      line: { color: "#A67DB8", width: 3 },
    },
    {
      x: loanPeriodLabels,
      y: currentRemainingPrincipal,
      type: "scatter",
      mode: "lines",
      name: "Current Loan (Remaining)<br>Principal Remaining",
      line: { color: "#4f5d75", width: 2, dash: "dot" },
    },
    {
      x: loanPeriodLabels,
      y: newRemainingPrincipal,
      type: "scatter",
      mode: "lines",
      name: "New Loan<br>Principal Remaining",
      line: { color: "#A67DB8", width: 2, dash: "dot" },
    },
    {
      x: loanPeriodLabels,
      y: currentCumulativeInterest,
      type: "scatter",
      mode: "lines",
      name: "Current Loan (Remaining)<br>Cumulative Interest",
      line: { color: "#4f5d75", width: 2, dash: "dash" },
    },
    {
      x: loanPeriodLabels,
      y: newCumulativeInterest,
      type: "scatter",
      mode: "lines",
      name: "New Loan<br>Cumulative Interest",
      line: { color: "#A67DB8", width: 2, dash: "dash" },
    },
  ];

  const amortizationChartLayout = {
    title: { text: "Amortization Schedule Comparison" },
    hovermode: "x unified",
    xaxis: {
      title: "Years From Current Period",
      nticks: 8,
      tickmode: "array",
      tickvals: xTickVals,
      ticktext: xTickText,
      tickangle: 0,
      automargin: true,
      gridcolor: "#f1f5f9",
      tickfont: { color: "#4f5d75", size: 10 },
    },
    yaxis: {
      title: "Amount ($)",
      tickformat: "$,.0f",
      gridcolor: "#f1f5f9",
      tickfont: { color: "#4f5d75", size: 10 },
    },
    legend: {
      orientation: "h",
      y: -0.32,
      x: 0,
      xanchor: "left",
      entrywidthmode: "fraction",
      entrywidth: 0.5,
    },
    hoverlabel: {
      namelength: -1,
      align: "left",
    },
    margin: { l: 65, r: 20, t: 40, b: 70 },
    height: 390,
  };

  const cashFlowData: Array<Record<string, unknown>> = [
    {
      x: loanPeriodLabels,
      y: currentCumulativePayments,
      type: "scatter",
      mode: "lines",
      name: "Current Loan (Remaining)<br>Cumulative Payments",
      line: { color: "#4f5d75", width: 2.5 },
    },
    {
      x: loanPeriodLabels,
      y: newCumulativePaymentsWithUpfront,
      type: "scatter",
      mode: "lines",
      name: "New Loan<br>Upfront + Cumulative Payments",
      line: { color: "#A67DB8", width: 3 },
    },
  ];

  const cashFlowLayout = {
    title: { text: "Cash Outflow Comparison and Break-even" },
    hovermode: "x unified",
    xaxis: {
      title: "Years From Current Period",
      nticks: 8,
      tickmode: "array",
      tickvals: xTickVals,
      ticktext: xTickText,
      tickangle: 0,
      automargin: true,
      gridcolor: "#f1f5f9",
      tickfont: { color: "#4f5d75", size: 10 },
    },
    yaxis: {
      title: "Cumulative Cash Outflow ($)",
      tickformat: "$,.0f",
      gridcolor: "#f1f5f9",
      tickfont: { color: "#4f5d75", size: 10 },
    },
    legend: { orientation: "h", y: -0.25 },
    hoverlabel: {
      namelength: -1,
      align: "left",
    },
    margin: { l: 70, r: 20, t: 40, b: 70 },
    height: 360,
    annotations: breakEvenMonth
      ? [
          {
            x: loanPeriodLabels[Math.max(0, breakEvenMonth - 1)],
            y: breakEvenLevel,
            text: `Break-even at month ${breakEvenMonth}`,
            showarrow: true,
            arrowhead: 2,
            arrowcolor: "#334155",
            arrowwidth: 1.5,
            ax: 30,
            ay: -30,
            bgcolor: "#ffffff",
            bordercolor: "#94a3b8",
            font: { color: "#334155" },
          },
        ]
      : [
          {
            x: loanPeriodLabels[Math.max(0, loanPeriodLabels.length - 1)],
            y: newCumulativePaymentsWithUpfront[Math.max(0, newCumulativePaymentsWithUpfront.length - 1)],
            text: "No break-even point in this term",
            showarrow: false,
            bgcolor: "#ffffff",
            bordercolor: "#e2e8f0",
          },
        ],
  };

  const monthlyPaymentComparisonData: Array<Record<string, unknown>> = [
    {
      x: loanPeriodLabels,
      y: currentMonthlyPayments,
      type: "scatter",
      mode: "lines",
      name: "Current Loan (Remaining)<br>Monthly Payment",
      line: { color: "#4f5d75", width: 2.5 },
    },
    {
      x: loanPeriodLabels,
      y: newMonthlyPayments,
      type: "scatter",
      mode: "lines",
      name: "New Loan<br>Monthly Payment",
      line: { color: "#A67DB8", width: 3 },
    },
  ];

  const monthlyPaymentValues = [...currentMonthlyPayments, ...newMonthlyPayments];
  const monthlyPaymentMin = Math.min(...monthlyPaymentValues);
  const monthlyPaymentMax = Math.max(...monthlyPaymentValues);
  const monthlyPaymentSpread = monthlyPaymentMax - monthlyPaymentMin;
  const monthlyPaymentAxisRange: [number, number] | undefined = monthlyPaymentSpread < 0.01
    ? [
        Math.max(0, monthlyPaymentMin - Math.max(1, monthlyPaymentMin * 0.02)),
        monthlyPaymentMax + Math.max(1, monthlyPaymentMax * 0.02),
      ]
    : undefined;

  const monthlyPaymentComparisonLayout = {
    title: { text: "Monthly Payment Comparison Over Time" },
    hovermode: "x unified",
    xaxis: {
      title: "Years From Current Period",
      nticks: 8,
      tickmode: "array",
      tickvals: xTickVals,
      ticktext: xTickText,
      tickangle: 0,
      automargin: true,
      gridcolor: "#f1f5f9",
      tickfont: { color: "#4f5d75", size: 10 },
    },
    yaxis: {
      title: "Monthly Payment ($)",
      tickformat: "$,.2f",
      gridcolor: "#f1f5f9",
      tickfont: { color: "#4f5d75", size: 10 },
      ...(monthlyPaymentAxisRange ? { range: monthlyPaymentAxisRange } : {}),
    },
    legend: { orientation: "h", y: -0.25 },
    hoverlabel: {
      namelength: -1,
      align: "left",
    },
    margin: { l: 70, r: 20, t: 40, b: 70 },
    height: 360,
  };

  outputsRef.current = {
    charts: {
      amortizationComparison: {
        intent: "Compares cumulative principal, remaining principal, and cumulative interest between remaining current-loan schedule and proposed new loan.",
        data: amortizationChartData,
        layout: amortizationChartLayout,
      },
      cashOutflowComparison: {
        intent: "Compares cumulative cash outflow of current remaining loan versus new loan with upfront cost and marks break-even where applicable.",
        data: cashFlowData,
        layout: cashFlowLayout,
      },
      monthlyPaymentComparison: {
        intent: "Compares monthly payment trajectories over time for remaining current loan and new loan.",
        data: monthlyPaymentComparisonData,
        layout: monthlyPaymentComparisonLayout,
      },
    },
    summary: {
      paymentDelta,
      termDeltaMonths,
      interestDelta,
      breakEvenMonth,
      breakEvenLevel,
    },
  };

  // Listen for input events from the agent to update the component state. This effect sets up a handler
  // for the "agent:setInput" event and updates the relevant state values when the event is received.
  useEffect(() => {
    const handleCollectState = (event: Event) => {
      const detail = (event as CustomEvent<{ page?: string }>).detail;
      if (!detail || detail.page !== "refinance") {
        return;
      }

      window.dispatchEvent(new CustomEvent("agent:state_collected", {
        detail: {
          page: "refinance",
          state: {
            selectedLoanId,
            currentOriginalAmount,
            currentOriginalTermYears,
            currentOriginalTermMonths,
            currentPositionInputMode,
            currentPrincipalRemainingInput,
            currentElapsedYearsInput,
            currentElapsedMonthsInput,
            currentRate,
            currentRateType,
            currentVarFixedYears,
            currentVarPeriodicity,
            currentVarMaxIncrease,
            currentVarVolatility,
            currentVarTrendScenario,
            currentVarRateMode,
            currentVarManualRates,
            upfrontCost,
            cashOut,
            newPrincipal,
            newLoanAmountMode,
            newTermYears,
            newTermMonths,
            newRate,
            newRateType,
            newVarFixedYears,
            newVarPeriodicity,
            newVarMaxIncrease,
            newVarVolatility,
            newVarTrendScenario,
            newVarRateMode,
            newVarManualRates,
            outputs: outputsRef.current,
          },
        },
      }));
    };

    window.addEventListener("agent:collect_state", handleCollectState as EventListener);
    return () => {
      window.removeEventListener("agent:collect_state", handleCollectState as EventListener);
    };
  }, [
    selectedLoanId,
    currentOriginalAmount,
    currentOriginalTermYears,
    currentOriginalTermMonths,
    currentPositionInputMode,
    currentPrincipalRemainingInput,
    currentElapsedYearsInput,
    currentElapsedMonthsInput,
    currentRate,
    currentRateType,
    currentVarFixedYears,
    currentVarPeriodicity,
    currentVarMaxIncrease,
    currentVarVolatility,
    currentVarTrendScenario,
    currentVarRateMode,
    currentVarManualRates,
    upfrontCost,
    cashOut,
    newPrincipal,
    newLoanAmountMode,
    newTermYears,
    newTermMonths,
    newRate,
    newRateType,
    newVarFixedYears,
    newVarPeriodicity,
    newVarMaxIncrease,
    newVarVolatility,
    newVarTrendScenario,
    newVarRateMode,
    newVarManualRates,
  ]);

  const formatCurrency = (value: number): string => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatYearMonthLabel = (month: number): string => `Year ${Math.floor((month - 1) / 12) + 1}, Month ${((month - 1) % 12) + 1}`;

  const getPrincipalPortion = (schedule: AmortizationResult, idx: number): number => {
    if (idx < 0 || idx >= schedule.cumulativePrincipal.length) {
      return 0;
    }
    if (idx === 0) {
      return schedule.cumulativePrincipal[0] ?? 0;
    }
    return (schedule.cumulativePrincipal[idx] ?? 0) - (schedule.cumulativePrincipal[idx - 1] ?? 0);
  };

  const getInterestPortion = (schedule: AmortizationResult, idx: number): number => {
    if (idx < 0 || idx >= schedule.cumulativeInterest.length) {
      return 0;
    }
    if (idx === 0) {
      return schedule.cumulativeInterest[0] ?? 0;
    }
    return (schedule.cumulativeInterest[idx] ?? 0) - (schedule.cumulativeInterest[idx - 1] ?? 0);
  };

  const handleExportCurrentCSV = () => {
    void fetch("/api/usage/export-activity", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ source: "refinance" }),
    }).catch(() => {
      // Best-effort tracking only; do not block export behavior.
    });

    const headers = "Period,Year-Month,Interest Rate (%),Payment,Principal Portion,Interest Portion,Cumulative Principal,Cumulative Interest,Principal Remaining after Period,Loan to Value (%)\n";

    const currentRows = currentFutureSchedule.monthlyPayments.map((payment, idx) => {
      const period = idx + 1;
      const rate = currentFutureSchedule.monthlyRates[idx] ?? 0;
      const principalPortion = getPrincipalPortion(currentFutureSchedule, idx);
      const interestPortion = getInterestPortion(currentFutureSchedule, idx);
      const cumulativePrincipalValue = (currentFutureSchedule.cumulativePrincipal[idx] ?? 0) + currentPrincipalPaidAtCurrentPeriod;
      const cumulativeInterestValue = (currentFutureSchedule.cumulativeInterest[idx] ?? 0) + currentInterestPaidAtCurrentPeriod;
      const remaining = currentFutureSchedule.remainingPrincipal[idx] ?? 0;
      const ltv = currentOriginalAmount > 0 ? (remaining / currentOriginalAmount) * 100 : 0;
      return `${period},${formatYearMonthLabel(period)},${rate.toFixed(2)},${payment},${principalPortion},${interestPortion},${cumulativePrincipalValue},${cumulativeInterestValue},${remaining},${ltv.toFixed(2)}`;
    }).join("\n");

    const csvContent = [
      "Current Loan (Remaining) Schedule",
      headers.trimEnd(),
      currentRows,
      "",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "refinance_current_loan_schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportNewCSV = () => {
    void fetch("/api/usage/export-activity", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ source: "refinance" }),
    }).catch(() => {
      // Best-effort tracking only; do not block export behavior.
    });

    const headers = "Period,Year-Month,Interest Rate (%),Payment,Principal Portion,Interest Portion,Cumulative Principal,Cumulative Interest,Principal Remaining after Period,Loan to Value (%)\n";

    const newRows = newSchedule.monthlyPayments.map((payment, idx) => {
      const period = idx + 1;
      const rate = newSchedule.monthlyRates[idx] ?? 0;
      const principalPortion = getPrincipalPortion(newSchedule, idx);
      const interestPortion = getInterestPortion(newSchedule, idx);
      const cumulativePrincipalValue = newSchedule.cumulativePrincipal[idx] ?? 0;
      const cumulativeInterestValue = newSchedule.cumulativeInterest[idx] ?? 0;
      const remaining = newSchedule.remainingPrincipal[idx] ?? 0;
      const ltv = newPrincipal > 0 ? (remaining / newPrincipal) * 100 : 0;
      return `${period},${formatYearMonthLabel(period)},${rate.toFixed(2)},${payment},${principalPortion},${interestPortion},${cumulativePrincipalValue},${cumulativeInterestValue},${remaining},${ltv.toFixed(2)}`;
    }).join("\n");

    const csvContent = [
      "New Loan Schedule",
      headers.trimEnd(),
      newRows,
      "",
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "refinance_new_loan_schedule.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1b3022] font-display flex items-center gap-2">
            <RefreshCw className="w-8 h-8 text-[#1b3022]" /> Refinance Scenarios
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Determine whether a refinance makes sense for your current loan situation.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
              Current Loan Inputs
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Fill from saved loans</label>
              {isLoadingLoans ? (
                <p className="text-xs text-slate-600">Loading saved loans...</p>
              ) : savedLoans.length === 0 ? (
                <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-3 border border-amber-200">
                  No saved loans found yet. You can still enter values manually below.
                </p>
              ) : (
                <select
                  className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-hidden font-sans font-medium text-slate-700"
                  value={selectedLoanId}
                  onChange={(event) => setSelectedLoanId(event.target.value)}
                >
                  {savedLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.name} ({loan.years}y, {loan.interestRate.toFixed(2)}%)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Interest Structure</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-lg border border-slate-150">
                  <button
                    type="button"
                    onClick={() => setCurrentRateType("fixed")}
                    className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      currentRateType === "fixed"
                        ? "bg-slate-200 text-brand-green shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Fixed Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentRateType("variable")}
                    className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      currentRateType === "variable"
                        ? "bg-slate-200 text-brand-green shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Variable Rate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Original Loan Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={currentOriginalAmount}
                  onChange={(event) => setCurrentOriginalAmount(Math.max(0, Number(event.target.value) || 0))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Original Loan Term</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                    value={currentOriginalTermYears}
                    onChange={(event) => setCurrentOriginalTermYears(Math.max(0, Number(event.target.value) || 0))}
                    placeholder="Years"
                  />
                  <input
                    type="number"
                    min={0}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                    value={currentOriginalTermMonths}
                    onChange={(event) => setCurrentOriginalTermMonths(Math.max(0, Number(event.target.value) || 0))}
                    placeholder="Months"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Current Loan Position Input</label>
                <select
                  className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-hidden font-sans font-medium text-slate-700"
                  value={currentPositionInputMode}
                  onChange={(event) => setCurrentPositionInputMode(event.target.value as CurrentPositionInputMode)}
                >
                  <option value="principal">Use current principal remaining</option>
                  <option value="term">Use current loan term (years/months)</option>
                </select>
              </div>

              {currentPositionInputMode === "principal" ? (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Current Principal Remaining ($)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                    value={currentPrincipalRemainingInput}
                    onChange={(event) => setCurrentPrincipalRemainingInput(Math.max(0, Number(event.target.value) || 0))}
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Current Loan Term (Years, Months)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(0, currentOriginalTermYears)}
                      className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                      value={currentElapsedYearsInput}
                      onChange={(event) => setCurrentElapsedYearsInput(Math.max(0, Number(event.target.value) || 0))}
                      placeholder="Years"
                    />
                    <input
                      type="number"
                      min={0}
                      className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                      value={currentElapsedMonthsInput}
                      onChange={(event) => setCurrentElapsedMonthsInput(Math.max(0, Number(event.target.value) || 0))}
                      placeholder="Months"
                    />
                  </div>
                </div>
              )}

              <div>
                {!currentPositionContext.hasInput && (
                  <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded mt-2 px-2 py-1.5">
                    {currentPositionInputMode === "principal"
                      ? "Enter current principal remaining to identify where you are in the current loan."
                      : "Enter current loan term in years/months to identify where you are in the current loan."}
                  </p>
                )}
                {currentPositionContext.hasInput && (
                  <p className="text-[10px] text-slate-600 mt-2">
                    {currentPositionContext.source === "principal"
                      ? `Current period inferred from principal remaining: month ${currentPositionContext.elapsedMonths}.`
                      : `Current period set directly from entered term: month ${currentPositionContext.elapsedMonths}.`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Current Interest Rate / Starting Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={currentRate}
                  onChange={(event) => setCurrentRate(Math.max(0, Number(event.target.value) || 0))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Cash Out ($)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={cashOut}
                  onChange={(event) => setCashOut(Math.max(0, Number(event.target.value) || 0))}
                />
              </div>

              {currentRateType === "variable" && (
                <div className="bg-[#1b3022]/5 border border-[#395756]/20 p-4 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-[#1b3022] flex items-center gap-1 font-display">
                    <TrendingUp className="w-3.5 h-3.5" /> Adjustments Configuration
                  </div>

                  <div className="bg-white border border-[#395756]/15 rounded-lg p-2 text-[11px] text-slate-700 font-medium">
                    <span className="text-[#395756] font-bold">Structured Target:</span><br />
                    <span className="font-mono text-xs">{getARMReadableString(currentVarFixedYears, currentVarPeriodicity)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Fixed Period</label>
                      <select
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                        value={currentVarFixedYears}
                        onChange={(event) => setCurrentVarFixedYears(Number(event.target.value))}
                      >
                        <option value={3}>3 Years Fixed</option>
                        <option value={5}>5 Years Fixed</option>
                        <option value={7}>7 Years Fixed</option>
                        <option value={10}>10 Years Fixed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Adjustment Era</label>
                      <select
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                        value={currentVarPeriodicity}
                        onChange={(event) => setCurrentVarPeriodicity(Number(event.target.value))}
                      >
                        <option value={6}>6 Months (0.5y)</option>
                        <option value={12}>1 Year (1.0y)</option>
                        <option value={24}>2 Years (2.0y)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-150 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Lifetime Rate Change Ceiling
                      </label>
                      <span className="text-[10px] font-bold text-[#1b3022] font-mono bg-[#1b3022]/10 px-1.5 py-0.5 rounded">
                        +{currentVarMaxIncrease.toFixed(1)}% limit above initial rate
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">%</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={currentVarMaxIncrease}
                        onChange={(event) => setCurrentVarMaxIncrease(Math.max(0, Number(event.target.value) || 0))}
                        className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1b3022] font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Max Rate Change Per Adjustment Era
                      </label>
                      <span className="text-[10px] font-bold text-[#1b3022] font-mono bg-[#1b3022]/10 px-1.5 py-0.5 rounded">
                        +/-{currentVarVolatility.toFixed(2)}% change
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">%</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={currentVarVolatility}
                        onChange={(event) => setCurrentVarVolatility(Math.max(0, Number(event.target.value) || 0))}
                        className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1b3022] font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-150 pt-2 space-y-2">
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                      Rate Trend Scenario
                    </label>
                    <select
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-sans font-medium text-slate-700"
                      value={currentVarTrendScenario}
                      onChange={(event) => setCurrentVarTrendScenario(event.target.value as VarTrendScenario)}
                    >
                      <option value="best">Best Case (Rates Always Go Down)</option>
                      <option value="average">Average Case (Fluctuations)</option>
                      <option value="worst">Worst Case (Rates Always Go Up)</option>
                    </select>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Adjustment Method</label>
                      <select
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-sans font-medium text-slate-700"
                        value={currentVarRateMode}
                        onChange={(event) => setCurrentVarRateMode(event.target.value as "trend" | "manual")}
                      >
                        <option value="trend">Projected Trend</option>
                        <option value="manual">Manual Entry</option>
                      </select>
                    </div>

                    {currentVarRateMode === "manual" && (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Manual adjustment rates</div>
                        <div className="text-[10px] text-slate-500 leading-relaxed">Enter the rates for each adjustment period. Missing values will be projected from the trend logic.</div>
                        {Array.from({ length: Math.max(0, Math.floor(Math.max(0, currentOriginalTotalMonths - currentVarFixedYears * 12) / currentVarPeriodicity)) }, (_, index) => {
                          const adjustmentIndex = index + 1;
                          const entry = currentVarManualRates.find((item) => item.adjustmentIndex === adjustmentIndex);
                          return (
                            <div key={adjustmentIndex} className="grid grid-cols-[1fr_auto] items-center gap-2">
                              <label className="text-[10px] font-medium text-slate-600">Adjusted Rate {adjustmentIndex}</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[10px]">%</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={entry ? entry.rate : ""}
                                  onChange={(event) => {
                                    const rawValue = event.target.value;
                                    if (rawValue === "") {
                                      setCurrentVarManualRates((entries) => entries.filter((item) => item.adjustmentIndex !== adjustmentIndex));
                                      return;
                                    }

                                    const nextValue = Number(rawValue);
                                    if (Number.isNaN(nextValue)) {
                                      return;
                                    }

                                    setCurrentVarManualRates((entries) => {
                                      const existing = entries.find((item) => item.adjustmentIndex === adjustmentIndex);
                                      if (existing) {
                                        return entries.map((item) => item.adjustmentIndex === adjustmentIndex ? { ...item, rate: nextValue } : item);
                                      }
                                      return [...entries, { adjustmentIndex, rate: nextValue }];
                                    });
                                  }}
                                  className="w-full text-xs pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
              New Loan Inputs
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Interest Structure</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-lg border border-slate-150">
                  <button
                    type="button"
                    onClick={() => setNewRateType("fixed")}
                    className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      newRateType === "fixed"
                        ? "bg-slate-200 text-brand-green shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Fixed Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRateType("variable")}
                    className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      newRateType === "variable"
                        ? "bg-slate-200 text-brand-green shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Variable Rate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">New Loan Amount Source</label>
                <select
                  className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-hidden font-sans font-medium text-slate-700"
                  value={newLoanAmountMode}
                  onChange={(event) => {
                    const nextMode = event.target.value as NewLoanAmountMode;
                    setNewLoanAmountMode(nextMode);
                    if (nextMode === "current-principal") {
                      setNewPrincipal(Math.max(0, currentPrincipalRemaining));
                    }
                  }}
                >
                  <option value="current-principal">Use Current Loan Principal Remaining</option>
                  <option value="different-amount">Use a Different Amount</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">New Loan Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  disabled={newLoanAmountMode === "current-principal"}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={newPrincipal}
                  onChange={(event) => {
                    if (newLoanAmountMode === "different-amount") {
                      setNewPrincipal(Math.max(0, Number(event.target.value) || 0));
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">New Loan Term</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                    value={newTermYears}
                    onChange={(event) => setNewTermYears(Math.max(0, Number(event.target.value) || 0))}
                    placeholder="Years"
                  />
                  <input
                    type="number"
                    min={0}
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                    value={newTermMonths}
                    onChange={(event) => setNewTermMonths(Math.max(0, Number(event.target.value) || 0))}
                    placeholder="Months"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">New Interest Rate / Starting Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={newRate}
                  onChange={(event) => setNewRate(Math.max(0, Number(event.target.value) || 0))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Upfront Cost ($), e.g. Closing Costs + Point Buy Down</label>
                <input
                  type="number"
                  min={0}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={upfrontCost}
                  onChange={(event) => setUpfrontCost(Math.max(0, Number(event.target.value) || 0))}
                />
              </div>

              {newRateType === "variable" && (
                <div className="bg-[#1b3022]/5 border border-[#395756]/20 p-4 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-[#1b3022] flex items-center gap-1 font-display">
                    <TrendingUp className="w-3.5 h-3.5" /> Adjustments Configuration
                  </div>

                  <div className="bg-white border border-[#395756]/15 rounded-lg p-2 text-[11px] text-slate-700 font-medium">
                    <span className="text-[#395756] font-bold">Structured Target:</span><br />
                    <span className="font-mono text-xs">{getARMReadableString(newVarFixedYears, newVarPeriodicity)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Fixed Period</label>
                      <select
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                        value={newVarFixedYears}
                        onChange={(event) => setNewVarFixedYears(Number(event.target.value))}
                      >
                        <option value={3}>3 Years Fixed</option>
                        <option value={5}>5 Years Fixed</option>
                        <option value={7}>7 Years Fixed</option>
                        <option value={10}>10 Years Fixed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Adjustment Era</label>
                      <select
                        className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                        value={newVarPeriodicity}
                        onChange={(event) => setNewVarPeriodicity(Number(event.target.value))}
                      >
                        <option value={6}>6 Months (0.5y)</option>
                        <option value={12}>1 Year (1.0y)</option>
                        <option value={24}>2 Years (2.0y)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-150 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Lifetime Rate Change Ceiling
                      </label>
                      <span className="text-[10px] font-bold text-[#1b3022] font-mono bg-[#1b3022]/10 px-1.5 py-0.5 rounded">
                        +{newVarMaxIncrease.toFixed(1)}% limit above initial rate
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">%</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={newVarMaxIncrease}
                        onChange={(event) => setNewVarMaxIncrease(Math.max(0, Number(event.target.value) || 0))}
                        className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1b3022] font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 flex flex-col">
                    <div className="flex justify-between items-center">
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Max Rate Change Per Adjustment Era
                      </label>
                      <span className="text-[10px] font-bold text-[#1b3022] font-mono bg-[#1b3022]/10 px-1.5 py-0.5 rounded">
                        +/-{newVarVolatility.toFixed(2)}% change
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">%</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newVarVolatility}
                        onChange={(event) => setNewVarVolatility(Math.max(0, Number(event.target.value) || 0))}
                        className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1b3022] font-mono text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-150 pt-2 space-y-2">
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                      Rate Trend Scenario
                    </label>
                    <select
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-sans font-medium text-slate-700"
                      value={newVarTrendScenario}
                      onChange={(event) => setNewVarTrendScenario(event.target.value as VarTrendScenario)}
                    >
                      <option value="best">Best Case (Rates Always Go Down)</option>
                      <option value="average">Average Case (Fluctuations)</option>
                      <option value="worst">Worst Case (Rates Always Go Up)</option>
                    </select>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">Adjustment Method</label>
                      <select
                        className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-sans font-medium text-slate-700"
                        value={newVarRateMode}
                        onChange={(event) => setNewVarRateMode(event.target.value as "trend" | "manual")}
                      >
                        <option value="trend">Projected Trend</option>
                        <option value="manual">Manual Entry</option>
                      </select>
                    </div>

                    {newVarRateMode === "manual" && (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Manual adjustment rates</div>
                        <div className="text-[10px] text-slate-500 leading-relaxed">Enter the rates for each adjustment period. Missing values will be projected from the trend logic.</div>
                        {Array.from({ length: Math.max(0, Math.floor(Math.max(0, newTotalMonths - newVarFixedYears * 12) / newVarPeriodicity)) }, (_, index) => {
                          const adjustmentIndex = index + 1;
                          const entry = newVarManualRates.find((item) => item.adjustmentIndex === adjustmentIndex);
                          return (
                            <div key={adjustmentIndex} className="grid grid-cols-[1fr_auto] items-center gap-2">
                              <label className="text-[10px] font-medium text-slate-600">Adjusted Rate {adjustmentIndex}</label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[10px]">%</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={entry ? entry.rate : ""}
                                  onChange={(event) => {
                                    const rawValue = event.target.value;
                                    if (rawValue === "") {
                                      setNewVarManualRates((entries) => entries.filter((item) => item.adjustmentIndex !== adjustmentIndex));
                                      return;
                                    }

                                    const nextValue = Number(rawValue);
                                    if (Number.isNaN(nextValue)) {
                                      return;
                                    }

                                    setNewVarManualRates((entries) => {
                                      const existing = entries.find((item) => item.adjustmentIndex === adjustmentIndex);
                                      if (existing) {
                                        return entries.map((item) => item.adjustmentIndex === adjustmentIndex ? { ...item, rate: nextValue } : item);
                                      }
                                      return [...entries, { adjustmentIndex, rate: nextValue }];
                                    });
                                  }}
                                  className="w-full text-xs pl-7 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 border-l-4 border-l-[#1b3022]">
              <div className="w-12 h-12 rounded-xl bg-[#1b3022]/10 flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-brand-green" />
              </div>
              <div>
                <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Difference in Monthly Payment</div>
                <div className="text-2xl font-bold font-display text-brand-green mt-0.5">{toSignedCurrency(paymentDelta)}</div>
                <p className="text-[10px] text-slate-600 mt-1">New max monthly payment minus current remaining max monthly payment</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 border-l-4 border-l-[#7261a3]">
              <div className="w-12 h-12 rounded-xl bg-[#7261a3]/10 flex items-center justify-center shrink-0">
                <CalendarDays className="w-6 h-6 text-[#7261a3]" />
              </div>
              <div>
                <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Difference in Loan Term</div>
                <div className="text-2xl font-bold font-display text-[#7261a3] mt-0.5">{termDeltaMonths > 0 ? "+" : ""}{termDeltaMonths} months</div>
                <p className="text-[10px] text-slate-600 mt-1">New payoff timeline minus current remaining timeline</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 border-l-4 border-l-[#395756]">
              <div className="w-12 h-12 rounded-xl bg-[#395756]/10 flex items-center justify-center shrink-0">
                <Coins className="w-6 h-6 text-[#395756]" />
              </div>
              <div>
                <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Difference in Total Interest</div>
                <div className="text-2xl font-bold font-display text-[#395756] mt-0.5">{toSignedCurrency(interestDelta)}</div>
                <p className="text-[10px] text-slate-600 mt-1">New total interest minus current remaining interest</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 border-l-4 border-l-[#4f5d75]">
              <div className="w-12 h-12 rounded-xl bg-[#4f5d75]/10 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6 text-[#4f5d75]" />
              </div>
              <div>
                <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Upfront Cost</div>
                <div className="text-2xl font-bold font-display text-[#4f5d75] mt-0.5">{toCurrency(upfrontCost)}</div>
                <p className="text-[10px] text-slate-600 mt-1">Estimated refinance closing cost</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 border-l-4 border-l-accent-lavender">
            <div className="w-12 h-12 rounded-xl bg-accent-lavender/10 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-accent-lavender" />
            </div>
            <div>
              <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Cash Out</div>
              <div className="text-2xl font-bold font-display text-accent-lavender mt-0.5">{toCurrency(cashOut)}</div>
              <p className="text-[10px] text-slate-600 mt-1">Cash equity received from the refinance</p>
            </div>
          </div>

          <p className="mb-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              The x-axis in the charts below is shown as <strong>years and months from the current time</strong>. For the current loan, past periods are omitted and only the remaining schedule is plotted.
            </span>
          </p>

          <p className="mb-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              Monthly payment amounts do not include escrow or fees like taxes, insurance, private mortgage insurance (PMI), or home owners association (HOA) fees.
            </span>
          </p>

          <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xs">
            <PlotlyChart id="refinance-amortization-plotly" data={amortizationChartData} layout={amortizationChartLayout} />
          </div>

          <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xs">
            <PlotlyChart id="refinance-cashflow-plotly" data={cashFlowData} layout={cashFlowLayout} />
            <p className="mt-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
              Cash out is excluded from this cash outflow comparison; only upfront cost and monthly payments are included.
            </p>
          </div>

          <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xs">
            <PlotlyChart id="refinance-monthly-payment-comparison-plotly" data={monthlyPaymentComparisonData} layout={monthlyPaymentComparisonLayout} />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-slate-900 font-display">Amortization Schedule Details - Current Loan</h4>
                <p className="text-slate-500 text-xs">Current loan schedule from the selected current period through payoff.</p>
              </div>
              <button
                id="export-refinance-current-schedule"
                onClick={handleExportCurrentCSV}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent-teal hover:bg-accent-slate text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download as CSV (Excel) File
              </button>
            </div>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0 font-mono">
                  <tr>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Year-Month</th>
                    <th className="py-3 px-4">Interest Rate (%)</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Principal Portion</th>
                    <th className="py-3 px-4">Interest Portion</th>
                    <th className="py-3 px-4">Cumulative Principal</th>
                    <th className="py-3 px-4">Cumulative Interest</th>
                    <th className="py-3 px-4">Principal Remaining after Period</th>
                    <th className="py-3 px-4">Loan to Value (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {currentFutureSchedule.monthlyPayments.map((payment, idx) => {
                    const period = idx + 1;
                    const rate = currentFutureSchedule.monthlyRates[idx] ?? 0;
                    const principalPortion = getPrincipalPortion(currentFutureSchedule, idx);
                    const interestPortion = getInterestPortion(currentFutureSchedule, idx);
                    const cumulativePrincipalValue = (currentFutureSchedule.cumulativePrincipal[idx] ?? 0) + currentPrincipalPaidAtCurrentPeriod;
                    const cumulativeInterestValue = (currentFutureSchedule.cumulativeInterest[idx] ?? 0) + currentInterestPaidAtCurrentPeriod;
                    const remaining = currentFutureSchedule.remainingPrincipal[idx] ?? 0;
                    const ltv = currentOriginalAmount > 0 ? (remaining / currentOriginalAmount) * 100 : 0;

                    return (
                      <tr key={`current-${period}`} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-bold text-brand-green">Month {period}</td>
                        <td className="py-2.5 px-4 text-slate-700">{formatYearMonthLabel(period)}</td>
                        <td className="py-2.5 px-4 text-slate-600">{rate.toFixed(2)}%</td>
                        <td className="py-2.5 px-4 font-bold">${formatCurrency(payment)}</td>
                        <td className="py-2.5 px-4 text-accent-teal">${formatCurrency(principalPortion)}</td>
                        <td className="py-2.5 px-4 text-accent-purple">${formatCurrency(interestPortion)}</td>
                        <td className="py-2.5 px-4 text-slate-700">${formatCurrency(cumulativePrincipalValue)}</td>
                        <td className="py-2.5 px-4 text-slate-700">${formatCurrency(cumulativeInterestValue)}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">${formatCurrency(remaining)}</td>
                        <td className="py-2.5 px-4 text-slate-700">{ltv.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-slate-900 font-display">Amortization Schedule Details - New Loan</h4>
                <p className="text-slate-500 text-xs">New loan schedule for the full term from month 1 to payoff.</p>
              </div>
              <button
                id="export-refinance-new-schedule"
                onClick={handleExportNewCSV}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent-teal hover:bg-accent-slate text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download as CSV (Excel) File
              </button>
            </div>

            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0 font-mono">
                  <tr>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Year-Month</th>
                    <th className="py-3 px-4">Interest Rate (%)</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Principal Portion</th>
                    <th className="py-3 px-4">Interest Portion</th>
                    <th className="py-3 px-4">Cumulative Principal</th>
                    <th className="py-3 px-4">Cumulative Interest</th>
                    <th className="py-3 px-4">Principal Remaining after Period</th>
                    <th className="py-3 px-4">Loan to Value (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {newSchedule.monthlyPayments.map((payment, idx) => {
                    const period = idx + 1;
                    const rate = newSchedule.monthlyRates[idx] ?? 0;
                    const principalPortion = getPrincipalPortion(newSchedule, idx);
                    const interestPortion = getInterestPortion(newSchedule, idx);
                    const cumulativePrincipalValue = newSchedule.cumulativePrincipal[idx] ?? 0;
                    const cumulativeInterestValue = newSchedule.cumulativeInterest[idx] ?? 0;
                    const remaining = newSchedule.remainingPrincipal[idx] ?? 0;
                    const ltv = newPrincipal > 0 ? (remaining / newPrincipal) * 100 : 0;

                    return (
                      <tr key={`new-${period}`} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-bold text-brand-green">Month {period}</td>
                        <td className="py-2.5 px-4 text-slate-700">{formatYearMonthLabel(period)}</td>
                        <td className="py-2.5 px-4 text-slate-600">{rate.toFixed(2)}%</td>
                        <td className="py-2.5 px-4 font-bold">${formatCurrency(payment)}</td>
                        <td className="py-2.5 px-4 text-accent-teal">${formatCurrency(principalPortion)}</td>
                        <td className="py-2.5 px-4 text-accent-purple">${formatCurrency(interestPortion)}</td>
                        <td className="py-2.5 px-4 text-slate-700">${formatCurrency(cumulativePrincipalValue)}</td>
                        <td className="py-2.5 px-4 text-slate-700">${formatCurrency(cumulativeInterestValue)}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">${formatCurrency(remaining)}</td>
                        <td className="py-2.5 px-4 text-slate-700">{ltv.toFixed(2)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
