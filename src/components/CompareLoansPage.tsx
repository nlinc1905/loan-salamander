import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, Info, CalendarDays, TrendingDown, TrendingUp, Bookmark, Copy } from "lucide-react";
import PlotlyChart from "./PlotlyChart";

type RateType = "fixed" | "variable";
type VarTrendScenario = "best" | "average" | "worst";

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
}

interface AmortizationResult {
  durationMonths: number;
  monthlyPayment: number;
  maxMonthlyPayment: number;
  totalInterest: number;
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

function calculateMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) {
    return principal / months;
  }

  const factor = Math.pow(1 + monthlyRate, months);
  return principal * ((monthlyRate * factor) / (factor - 1));
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
  const monthlyPayments: number[] = [];

  for (let month = 1; month <= months; month += 1) {
    if (remaining <= 0) {
      break;
    }

    if (variableConfig.rateType === "variable" && month > variableConfig.varFixedYears * 12) {
      const elapsedSinceFixed = month - 1 - (variableConfig.varFixedYears * 12);
      if (elapsedSinceFixed % variableConfig.varPeriodicity === 0) {
        if (variableConfig.varTrendScenario === "average") {
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
      payment = remaining * ((monthlyRate * Math.pow(1 + monthlyRate, nRemaining)) / (Math.pow(1 + monthlyRate, nRemaining) - 1));
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
    monthlyPayments.push(paymentForMonth);
  }

  return {
    durationMonths: cumulativePayments.length,
    monthlyPayment: cumulativePayments.length > 0 ? cumulativePayments[0] : 0,
    maxMonthlyPayment,
    totalInterest: interestSoFar,
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

export default function CompareLoansPage() {
  const [savedLoans, setSavedLoans] = useState<LoanOption[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [selectedLoan2Id, setSelectedLoan2Id] = useState("");
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);

  const [currentPrincipal, setCurrentPrincipal] = useState(300000);
  const [currentRate, setCurrentRate] = useState(6.25);
  const [currentTermMonths, setCurrentTermMonths] = useState(300);
  const [currentRateType, setCurrentRateType] = useState<RateType>("fixed");
  const [currentVarFixedYears, setCurrentVarFixedYears] = useState(5);
  const [currentVarPeriodicity, setCurrentVarPeriodicity] = useState(12);
  const [currentVarMaxIncrease, setCurrentVarMaxIncrease] = useState(4);
  const [currentVarVolatility, setCurrentVarVolatility] = useState(0.5);
  const [currentVarTrendScenario, setCurrentVarTrendScenario] = useState<VarTrendScenario>("average");

  const [newPrincipal, setNewPrincipal] = useState(300000);
  const [newRate, setNewRate] = useState(5.5);
  const [newTermMonths, setNewTermMonths] = useState(360);
  const [newRateType, setNewRateType] = useState<RateType>("fixed");
  const [newVarFixedYears, setNewVarFixedYears] = useState(5);
  const [newVarPeriodicity, setNewVarPeriodicity] = useState(12);
  const [newVarMaxIncrease, setNewVarMaxIncrease] = useState(4);
  const [newVarVolatility, setNewVarVolatility] = useState(0.5);
  const [newVarTrendScenario, setNewVarTrendScenario] = useState<VarTrendScenario>("average");

  const [loan1Name, setLoan1Name] = useState("");
  const [loan2Name, setLoan2Name] = useState("");
  const [isSavingLoan1, setIsSavingLoan1] = useState(false);
  const [isSavingLoan2, setIsSavingLoan2] = useState(false);
  const [saveLoan1Status, setSaveLoan1Status] = useState<{ success: boolean; message: string } | null>(null);
  const [saveLoan2Status, setSaveLoan2Status] = useState<{ success: boolean; message: string } | null>(null);
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
      if (!detail || detail.page !== "compareLoans" || !detail.state || typeof detail.state !== "object") {
        return;
      }

      const state = detail.state;

      if (typeof state.selectedLoanId === "string") {
        setSelectedLoanId(state.selectedLoanId);
      }
      if (typeof state.selectedLoan2Id === "string") {
        setSelectedLoan2Id(state.selectedLoan2Id);
      }

      const currentPrincipalValue = toNumber(state.currentPrincipal);
      if (currentPrincipalValue !== null) setCurrentPrincipal(Math.max(0, currentPrincipalValue));

      const currentRateValue = toNumber(state.currentRate);
      if (currentRateValue !== null) setCurrentRate(Math.max(0, currentRateValue));

      const currentTermMonthsValue = toNumber(state.currentTermMonths);
      if (currentTermMonthsValue !== null) setCurrentTermMonths(Math.max(1, Math.trunc(currentTermMonthsValue)));

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

      const newPrincipalValue = toNumber(state.newPrincipal);
      if (newPrincipalValue !== null) setNewPrincipal(Math.max(0, newPrincipalValue));

      const newRateValue = toNumber(state.newRate);
      if (newRateValue !== null) setNewRate(Math.max(0, newRateValue));

      const newTermMonthsValue = toNumber(state.newTermMonths);
      if (newTermMonthsValue !== null) setNewTermMonths(Math.max(1, Math.trunc(newTermMonthsValue)));

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

      if (typeof state.loan1Name === "string") {
        setLoan1Name(state.loan1Name);
      }
      if (typeof state.loan2Name === "string") {
        setLoan2Name(state.loan2Name);
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
          setSelectedLoan2Id(defaultLoan.id);
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

    const inferredPrincipal = Math.max(0, selected.assetCost - selected.downPayment);
    const inferredMonths = Math.max(1, selected.years * 12 + selected.months);

    setCurrentPrincipal(inferredPrincipal);
    setCurrentRate(Math.max(0, selected.interestRate));
    setCurrentTermMonths(inferredMonths);
    setCurrentRateType(selected.rateType === "variable" ? "variable" : "fixed");
    setCurrentVarFixedYears(selected.varFixedYears ?? 5);
    setCurrentVarPeriodicity(selected.varPeriodicity ?? 12);
    setCurrentVarMaxIncrease(selected.varMaxIncrease ?? 4);
    setCurrentVarVolatility(selected.varVolatility ?? 0.5);
    setCurrentVarTrendScenario(selected.varTrendScenario ?? "average");

  }, [selectedLoanId, savedLoans]);

  useEffect(() => {
    if (!selectedLoan2Id) {
      return;
    }

    const selected = savedLoans.find((loan) => loan.id === selectedLoan2Id);
    if (!selected) {
      return;
    }

    const inferredPrincipal = Math.max(0, selected.assetCost - selected.downPayment);
    const inferredMonths = Math.max(1, selected.years * 12 + selected.months);

    setNewPrincipal(inferredPrincipal);
    setNewRate(Math.max(0, selected.interestRate));
    setNewTermMonths(inferredMonths);
    setNewRateType(selected.rateType === "variable" ? "variable" : "fixed");
    setNewVarFixedYears(selected.varFixedYears ?? 5);
    setNewVarPeriodicity(selected.varPeriodicity ?? 12);
    setNewVarMaxIncrease(selected.varMaxIncrease ?? 4);
    setNewVarVolatility(selected.varVolatility ?? 0.5);
    setNewVarTrendScenario(selected.varTrendScenario ?? "average");
  }, [selectedLoan2Id, savedLoans]);

  const saveLoanConfig = async (
    loanName: string,
    principal: number,
    rate: number,
    termMonths: number,
    rateType: RateType,
    varConfig: {
      varFixedYears: number;
      varPeriodicity: number;
      varMaxIncrease: number;
      varVolatility: number;
      varTrendScenario: VarTrendScenario;
    },
  ) => {
    const response = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: loanName,
        assetCost: Math.max(0, principal),
        downPayment: 0,
        interestRate: Math.max(0, rate),
        years: Math.floor(Math.max(1, termMonths) / 12),
        months: Math.max(1, termMonths) % 12,
        loanType: "other",
        rateType,
        varFixedYears: varConfig.varFixedYears,
        varPeriodicity: varConfig.varPeriodicity,
        varMaxIncrease: varConfig.varMaxIncrease,
        varVolatility: varConfig.varVolatility,
        varTrendScenario: varConfig.varTrendScenario,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data?.success) {
      throw new Error(data?.error || "Failed to save loan configuration.");
    }
  };

  const handleSaveLoan1 = async () => {
    if (!loan1Name.trim()) {
      setSaveLoan1Status({ success: false, message: "Please enter a name for Loan 1." });
      return;
    }

    setIsSavingLoan1(true);
    setSaveLoan1Status(null);
    try {
      await saveLoanConfig(loan1Name, currentPrincipal, currentRate, currentTermMonths, currentRateType, {
        varFixedYears: currentVarFixedYears,
        varPeriodicity: currentVarPeriodicity,
        varMaxIncrease: currentVarMaxIncrease,
        varVolatility: currentVarVolatility,
        varTrendScenario: currentVarTrendScenario,
      });
      setSaveLoan1Status({ success: true, message: `Loan "${loan1Name}" saved successfully.` });
      setLoan1Name("");
      void (async () => {
        const response = await fetch("/api/loans");
        const data = await response.json();
        if (response.ok && data?.success && Array.isArray(data.loans)) {
          setSavedLoans(data.loans as LoanOption[]);
        }
      })();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save Loan 1.";
      setSaveLoan1Status({ success: false, message });
    } finally {
      setIsSavingLoan1(false);
    }
  };

  const handleSaveLoan2 = async () => {
    if (!loan2Name.trim()) {
      setSaveLoan2Status({ success: false, message: "Please enter a name for Loan 2." });
      return;
    }

    setIsSavingLoan2(true);
    setSaveLoan2Status(null);
    try {
      await saveLoanConfig(loan2Name, newPrincipal, newRate, newTermMonths, newRateType, {
        varFixedYears: newVarFixedYears,
        varPeriodicity: newVarPeriodicity,
        varMaxIncrease: newVarMaxIncrease,
        varVolatility: newVarVolatility,
        varTrendScenario: newVarTrendScenario,
      });
      setSaveLoan2Status({ success: true, message: `Loan "${loan2Name}" saved successfully.` });
      setLoan2Name("");
      void (async () => {
        const response = await fetch("/api/loans");
        const data = await response.json();
        if (response.ok && data?.success && Array.isArray(data.loans)) {
          setSavedLoans(data.loans as LoanOption[]);
        }
      })();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save Loan 2.";
      setSaveLoan2Status({ success: false, message });
    } finally {
      setIsSavingLoan2(false);
    }
  };

  const currentVariableConfig = useMemo<VariableRateConfig>(() => ({
    rateType: currentRateType,
    varFixedYears: currentVarFixedYears,
    varPeriodicity: currentVarPeriodicity,
    varMaxIncrease: currentVarMaxIncrease,
    varVolatility: currentVarVolatility,
    varTrendScenario: currentVarTrendScenario,
  }), [
    currentRateType,
    currentVarFixedYears,
    currentVarPeriodicity,
    currentVarMaxIncrease,
    currentVarVolatility,
    currentVarTrendScenario,
  ]);

  const newVariableConfig = useMemo<VariableRateConfig>(() => ({
    rateType: newRateType,
    varFixedYears: newVarFixedYears,
    varPeriodicity: newVarPeriodicity,
    varMaxIncrease: newVarMaxIncrease,
    varVolatility: newVarVolatility,
    varTrendScenario: newVarTrendScenario,
  }), [
    newRateType,
    newVarFixedYears,
    newVarPeriodicity,
    newVarMaxIncrease,
    newVarVolatility,
    newVarTrendScenario,
  ]);

  const currentSchedule = useMemo(
    () => buildAmortization(currentPrincipal, currentRate, currentTermMonths, currentVariableConfig),
    [currentPrincipal, currentRate, currentTermMonths, currentVariableConfig],
  );

  const newSchedule = useMemo(
    () => buildAmortization(newPrincipal, newRate, newTermMonths, newVariableConfig),
    [newPrincipal, newRate, newTermMonths, newVariableConfig],
  );

  const paymentDelta = newSchedule.maxMonthlyPayment - currentSchedule.maxMonthlyPayment;
  const termDeltaMonths = newSchedule.durationMonths - currentSchedule.durationMonths;
  const interestDelta = newSchedule.totalInterest - currentSchedule.totalInterest;

  const maxTimelineMonths = Math.max(currentSchedule.durationMonths, newSchedule.durationMonths, 1);
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

  const currentCumulativePrincipal = fillToTimeline(currentSchedule.cumulativePrincipal);
  const newCumulativePrincipal = fillToTimeline(newSchedule.cumulativePrincipal);
  const currentRemainingPrincipal = fillToTimeline(currentSchedule.remainingPrincipal);
  const newRemainingPrincipal = fillToTimeline(newSchedule.remainingPrincipal);
  const currentCumulativeInterest = fillToTimeline(currentSchedule.cumulativeInterest);
  const newCumulativeInterest = fillToTimeline(newSchedule.cumulativeInterest);

  const currentCumulativePayments = fillToTimeline(currentSchedule.cumulativePayments);
  const newCumulativePayments = fillToTimeline(newSchedule.cumulativePayments);
  const fillToTimelineWithZero = (series: number[]): number[] => monthAxis.map((_, idx) => (idx < series.length ? series[idx] : 0));
  const currentMonthlyPayments = fillToTimelineWithZero(currentSchedule.monthlyPayments);
  const newMonthlyPayments = fillToTimelineWithZero(newSchedule.monthlyPayments);

  let breakEvenMonth: number | null = null;
  for (let idx = 0; idx < monthAxis.length; idx += 1) {
    if (newCumulativePayments[idx] <= currentCumulativePayments[idx]) {
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
      name: "Loan 1<br>Cumulative Principal Paid",
      line: { color: "#4f5d75", width: 2 },
    },
    {
      x: loanPeriodLabels,
      y: newCumulativePrincipal,
      type: "scatter",
      mode: "lines",
      name: "Loan 2<br>Cumulative Principal Paid",
      line: { color: "#A67DB8", width: 3 },
    },
    {
      x: loanPeriodLabels,
      y: currentRemainingPrincipal,
      type: "scatter",
      mode: "lines",
      name: "Loan 1<br>Principal Remaining",
      line: { color: "#4f5d75", width: 2, dash: "dot" },
    },
    {
      x: loanPeriodLabels,
      y: newRemainingPrincipal,
      type: "scatter",
      mode: "lines",
      name: "Loan 2<br>Principal Remaining",
      line: { color: "#A67DB8", width: 2, dash: "dot" },
    },
    {
      x: loanPeriodLabels,
      y: currentCumulativeInterest,
      type: "scatter",
      mode: "lines",
      name: "Loan 1<br>Cumulative Interest Paid",
      line: { color: "#4f5d75", width: 2, dash: "dash" },
    },
    {
      x: loanPeriodLabels,
      y: newCumulativeInterest,
      type: "scatter",
      mode: "lines",
      name: "Loan 2<br>Cumulative Interest Paid",
      line: { color: "#A67DB8", width: 2, dash: "dash" },
    },
  ];

  const amortizationChartLayout = {
    title: { text: "Amortization Schedule Comparison" },
    hovermode: "x unified",
    xaxis: {
      title: "Loan Period",
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

  const monthlyPaymentComparisonData: Array<Record<string, unknown>> = [
    {
      x: loanPeriodLabels,
      y: currentMonthlyPayments,
      type: "scatter",
      mode: "lines",
      name: "Loan 1<br>Monthly Payment",
      line: { color: "#4f5d75", width: 2.5 },
    },
    {
      x: loanPeriodLabels,
      y: newMonthlyPayments,
      type: "scatter",
      mode: "lines",
      name: "Loan 2<br>Monthly Payment",
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
      title: "Loan Period",
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
        intent: "Compares cumulative principal, remaining principal, and cumulative interest trajectories for Loan 1 and Loan 2.",
        data: amortizationChartData,
        layout: amortizationChartLayout,
      },
      monthlyPaymentComparison: {
        intent: "Compares monthly payment amounts over time for Loan 1 and Loan 2.",
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
      if (!detail || detail.page !== "compareLoans") {
        return;
      }

      window.dispatchEvent(new CustomEvent("agent:state_collected", {
        detail: {
          page: "compareLoans",
          state: {
            selectedLoanId,
            selectedLoan2Id,
            currentPrincipal,
            currentRate,
            currentTermMonths,
            currentRateType,
            currentVarFixedYears,
            currentVarPeriodicity,
            currentVarMaxIncrease,
            currentVarVolatility,
            currentVarTrendScenario,
            newPrincipal,
            newRate,
            newTermMonths,
            newRateType,
            newVarFixedYears,
            newVarPeriodicity,
            newVarMaxIncrease,
            newVarVolatility,
            newVarTrendScenario,
            loan1Name,
            loan2Name,
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
    selectedLoan2Id,
    currentPrincipal,
    currentRate,
    currentTermMonths,
    currentRateType,
    currentVarFixedYears,
    currentVarPeriodicity,
    currentVarMaxIncrease,
    currentVarVolatility,
    currentVarTrendScenario,
    newPrincipal,
    newRate,
    newTermMonths,
    newRateType,
    newVarFixedYears,
    newVarPeriodicity,
    newVarMaxIncrease,
    newVarVolatility,
    newVarTrendScenario,
    loan1Name,
    loan2Name,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1b3022] font-display flex items-center gap-2">
            <Copy className="w-8 h-8 text-[#1b3022]" /> Compare Loans
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Compare two loans to determine which is better for you.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
              Loan 1 Inputs
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
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Loan 1 Principal Balance ($)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={currentPrincipal}
                  onChange={(event) => setCurrentPrincipal(Math.max(0, Number(event.target.value) || 0))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Loan 1 Interest Rate (%)</label>
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
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Loan 1 Periods (Months)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={currentTermMonths}
                  onChange={(event) => setCurrentTermMonths(Math.max(1, Number(event.target.value) || 1))}
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
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                        Fixed Period
                      </label>
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
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                        Adjustment Era
                      </label>
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
                        &plusmn;{currentVarVolatility.toFixed(2)}% change
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

                  <div className="border-t border-slate-150 pt-2">
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
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase font-display flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-accent-teal" /> Save Loan 1
                </h4>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Give Loan 1 a name to save this configuration.
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Loan 1 - Baseline"
                    className="w-full text-xs px-2.5 py-2 bg-white border border-slate-250 rounded-lg focus:outline-hidden focus:border-brand-green font-sans"
                    value={loan1Name}
                    onChange={(event) => setLoan1Name(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleSaveLoan1}
                    disabled={isSavingLoan1 || !loan1Name.trim()}
                    className="w-full py-1.5 bg-accent-teal hover:bg-accent-slate disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    {isSavingLoan1 ? "Saving..." : "Save Loan 1"}
                  </button>
                  {saveLoan1Status && (
                    <div className={`text-[10px] p-2 rounded-lg font-medium ${
                      saveLoan1Status.success ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                    }`}>
                      {saveLoan1Status.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
              Loan 2 Inputs
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Fill Loan 2 from saved loans</label>
                {isLoadingLoans ? (
                  <p className="text-xs text-slate-600">Loading saved loans...</p>
                ) : savedLoans.length === 0 ? (
                  <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-3 border border-amber-200">
                    No saved loans found yet. You can still enter Loan 2 values manually below.
                  </p>
                ) : (
                  <select
                    className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-hidden font-sans font-medium text-slate-700"
                    value={selectedLoan2Id}
                    onChange={(event) => setSelectedLoan2Id(event.target.value)}
                  >
                    {savedLoans.map((loan) => (
                      <option key={loan.id} value={loan.id}>
                        {loan.name} ({loan.years}y, {loan.interestRate.toFixed(2)}%)
                      </option>
                    ))}
                  </select>
                )}
              </div>

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
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Loan 2 Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={newPrincipal}
                  onChange={(event) => setNewPrincipal(Math.max(0, Number(event.target.value) || 0))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Loan 2 Interest Rate (%)</label>
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
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Loan 2 Periods (Months)</label>
                <input
                  type="number"
                  min={1}
                  className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                  value={newTermMonths}
                  onChange={(event) => setNewTermMonths(Math.max(1, Number(event.target.value) || 1))}
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
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                        Fixed Period
                      </label>
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
                      <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                        Adjustment Era
                      </label>
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
                        &plusmn;{newVarVolatility.toFixed(2)}% change
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

                  <div className="border-t border-slate-150 pt-2">
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
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase font-display flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-accent-teal" /> Save Loan 2
                </h4>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Give Loan 2 a name to save this configuration.
                  </p>
                  <input
                    type="text"
                    placeholder="e.g. Loan 2 - Refinance Option"
                    className="w-full text-xs px-2.5 py-2 bg-white border border-slate-250 rounded-lg focus:outline-hidden focus:border-brand-green font-sans"
                    value={loan2Name}
                    onChange={(event) => setLoan2Name(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleSaveLoan2}
                    disabled={isSavingLoan2 || !loan2Name.trim()}
                    className="w-full py-1.5 bg-accent-teal hover:bg-accent-slate disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    {isSavingLoan2 ? "Saving..." : "Save Loan 2"}
                  </button>
                  {saveLoan2Status && (
                    <div className={`text-[10px] p-2 rounded-lg font-medium ${
                      saveLoan2Status.success ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                    }`}>
                      {saveLoan2Status.message}
                    </div>
                  )}
                </div>
              </div>
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
                <p className="text-[10px] text-slate-600 mt-1">Loan 2 max monthly payment minus Loan 1 max monthly payment</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 border-l-4 border-l-[#7261a3]">
              <div className="w-12 h-12 rounded-xl bg-[#7261a3]/10 flex items-center justify-center shrink-0">
                <CalendarDays className="w-6 h-6 text-[#7261a3]" />
              </div>
              <div>
                <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Difference in Loan Term</div>
                <div className="text-2xl font-bold font-display text-[#7261a3] mt-0.5">{termDeltaMonths > 0 ? "+" : ""}{termDeltaMonths} months</div>
                <p className="text-[10px] text-slate-600 mt-1">Loan 2 payoff timeline minus Loan 1 timeline</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 border-l-4 border-l-[#395756]">
              <div className="w-12 h-12 rounded-xl bg-[#395756]/10 flex items-center justify-center shrink-0">
                <Coins className="w-6 h-6 text-[#395756]" />
              </div>
              <div>
                <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Difference in Total Interest</div>
                <div className="text-2xl font-bold font-display text-[#395756] mt-0.5">{toSignedCurrency(interestDelta)}</div>
                <p className="text-[10px] text-slate-600 mt-1">Loan 2 total interest minus Loan 1 total interest</p>
              </div>
            </div>
          </div>

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
            <PlotlyChart id="refinance-monthly-payment-comparison-plotly" data={monthlyPaymentComparisonData} layout={monthlyPaymentComparisonLayout} />
          </div>
        </div>
      </div>
    </div>
  );
}
