import { useState, useEffect, useRef } from "react";
import { 
  Calculator,
  Info,
  DollarSign,
  TrendingDown,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  Percent,
  Bookmark,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import PlotlyChart from "./PlotlyChart";
import SignInRequiredModal from "./SignInRequiredModal";
import { LoanParams, AmortizationSchedule, AmortizationRow } from "../types";

interface CalculatorPageProps {
  isPremium?: boolean;
  onUpgrade?: () => void;
}

interface SavedLoanConfig {
  id: string;
  name: string;
  assetCost: number;
  downPayment: number;
  interestRate: number;
  years: number;
  months: number;
  loanType: "mortgage" | "education" | "auto" | "other";
  rateType: "fixed" | "variable";
  varFixedYears: number;
  varPeriodicity: number;
  varMaxIncrease: number;
  varVolatility: number;
  varTrendScenario?: "best" | "average" | "worst";
  varRateMode?: "trend" | "manual";
  varManualRates?: Array<{ adjustmentIndex: number; rate: number }>;
}

interface AgentSetInputEventDetail {
  page?: string;
  state?: Record<string, unknown>;
}

export default function CalculatorPage({ isPremium = false, onUpgrade }: CalculatorPageProps) {
  const [loanType, setLoanType] = useState<"mortgage" | "education" | "auto" | "other">("mortgage");
  const [rateType, setRateType] = useState<"fixed" | "variable">("fixed");
  
  // Basic Loan Specs
  const [assetCost, setAssetCost] = useState(350000);
  const [downPayment, setDownPayment] = useState(70000);
  const [interestRate, setInterestRate] = useState(6.5); // %
  const [years, setYears] = useState(30);
  const [months, setMonths] = useState(0);

  // Variable Rate specific settings - Split into 2 Dropdowns
  const [varFixedYears, setVarFixedYears] = useState(5); // Initial Fixed rate period (3, 5, 7, 10 years)
  const [varPeriodicity, setVarPeriodicity] = useState(12); // Adjustment frequency (6 months [6], 1 year [12], 2 years [24])
  const [varMaxIncrease, setVarMaxIncrease] = useState(4.0); // % cap on rate increases
  const [varVolatility, setVarVolatility] = useState(0.5); // % adjustment magnitude
  const [varTrendScenario, setVarTrendScenario] = useState<"best" | "average" | "worst">("average"); // Rate Trend Scenario
  const [varRateMode, setVarRateMode] = useState<"trend" | "manual">("trend");
  const [varManualRates, setVarManualRates] = useState<Array<{ adjustmentIndex: number; rate: number }>>([]);

  // Saved Loan details for premium users
  const [loanName, setLoanName] = useState("");
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [savedLoans, setSavedLoans] = useState<SavedLoanConfig[]>([]);
  const [selectedLoadLoanId, setSelectedLoadLoanId] = useState("");
  const [isLoadingSavedLoans, setIsLoadingSavedLoans] = useState(false);
  const [loadStatus, setLoadStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Calculated State
  const [schedule, setSchedule] = useState<AmortizationSchedule | null>(null);
  const outputsRef = useRef<Record<string, unknown>>({
    charts: {},
    summary: {},
  });

  // Listen for external input updates via the "set_input" event and
  // update the local component state accordingly. This allows the
  // calculator page to respond to partial state updates coming
  // from other parts of the system.
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
      if (!detail || detail.page !== "calculator" || !detail.state || typeof detail.state !== "object") {
        return;
      }

      const state = detail.state;

      if (typeof state.loanType === "string" && ["mortgage", "education", "auto", "other"].includes(state.loanType)) {
        setLoanType(state.loanType as "mortgage" | "education" | "auto" | "other");
      }
      if (typeof state.rateType === "string" && ["fixed", "variable"].includes(state.rateType)) {
        setRateType(state.rateType as "fixed" | "variable");
      }

      const assetCostValue = toNumber(state.assetCost);
      if (assetCostValue !== null) {
        setAssetCost(Math.max(0, assetCostValue));
      }

      const downPaymentValue = toNumber(state.downPayment);
      if (downPaymentValue !== null) {
        setDownPayment(Math.max(0, downPaymentValue));
      }

      const interestRateValue = toNumber(state.interestRate);
      if (interestRateValue !== null) {
        setInterestRate(Math.max(0, interestRateValue));
      }

      const yearsValue = toNumber(state.years);
      if (yearsValue !== null) {
        setYears(Math.min(40, Math.max(0, Math.trunc(yearsValue))));
      }

      const monthsValue = toNumber(state.months);
      if (monthsValue !== null) {
        setMonths(Math.min(11, Math.max(0, Math.trunc(monthsValue))));
      }

      const varFixedYearsValue = toNumber(state.varFixedYears);
      if (varFixedYearsValue !== null && [3, 5, 7, 10].includes(Math.trunc(varFixedYearsValue))) {
        setVarFixedYears(Math.trunc(varFixedYearsValue));
      }

      const varPeriodicityValue = toNumber(state.varPeriodicity);
      if (varPeriodicityValue !== null && [6, 12, 24].includes(Math.trunc(varPeriodicityValue))) {
        setVarPeriodicity(Math.trunc(varPeriodicityValue));
      }

      const varMaxIncreaseValue = toNumber(state.varMaxIncrease);
      if (varMaxIncreaseValue !== null) {
        setVarMaxIncrease(Math.max(0, varMaxIncreaseValue));
      }

      const varVolatilityValue = toNumber(state.varVolatility);
      if (varVolatilityValue !== null) {
        setVarVolatility(Math.max(0, varVolatilityValue));
      }

      if (typeof state.varTrendScenario === "string" && ["best", "average", "worst"].includes(state.varTrendScenario)) {
        setVarTrendScenario(state.varTrendScenario as "best" | "average" | "worst");
      }

      if (typeof state.varRateMode === "string" && ["trend", "manual"].includes(state.varRateMode)) {
        setVarRateMode(state.varRateMode as "trend" | "manual");
      }

      if (Array.isArray(state.varManualRates)) {
        setVarManualRates(state.varManualRates as Array<{ adjustmentIndex: number; rate: number }>);
      }

      if (typeof state.loanName === "string") {
        setLoanName(state.loanName);
      }

      if (typeof state.selectedLoadLoanId === "string") {
        setSelectedLoadLoanId(state.selectedLoadLoanId);
      }
    };

    window.addEventListener("agent:set_input", handleSetInputEvent as EventListener);
    return () => {
      window.removeEventListener("agent:set_input", handleSetInputEvent as EventListener);
    };
  }, []);

  // Handle agent:collect_state events to provide the current calculator page state.
  useEffect(() => {
    const handleCollectState = (event: Event) => {
      const detail = (event as CustomEvent<{ page?: string }>).detail;
      if (!detail || detail.page !== "calculator") {
        return;
      }

      window.dispatchEvent(new CustomEvent("agent:state_collected", {
        detail: {
          page: "calculator",
          state: {
            loanType,
            rateType,
            assetCost,
            downPayment,
            interestRate,
            years,
            months,
            varFixedYears,
            varPeriodicity,
            varMaxIncrease,
            varVolatility,
            varTrendScenario,
            varRateMode,
            varManualRates,
            loanName,
            selectedLoadLoanId,
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
    loanType,
    rateType,
    assetCost,
    downPayment,
    interestRate,
    years,
    months,
    varFixedYears,
    varPeriodicity,
    varMaxIncrease,
    varVolatility,
    varTrendScenario,
    varRateMode,
    varManualRates,
    loanName,
    selectedLoadLoanId,
  ]);

  // Auto-fill defaults for Loan Types
  const handleLoanTypeSelect = (type: "mortgage" | "education" | "auto" | "other") => {
    setLoanType(type);
    if (type === "mortgage") {
      setAssetCost(450000);
      setDownPayment(90000);
      setInterestRate(6.5);
      setYears(30);
      setMonths(0);
    } else if (type === "auto") {
      setAssetCost(35000);
      setDownPayment(5000);
      setInterestRate(5.2);
      setYears(5);
      setMonths(0);
    } else if (type === "education") {
      setAssetCost(50000);
      setDownPayment(0);
      setInterestRate(4.8);
      setYears(10);
      setMonths(0);
    } else {
      setAssetCost(15000);
      setDownPayment(0);
      setInterestRate(8.9);
      setYears(3);
      setMonths(0);
    }
  };

  // Compute Total Duration in Months
  const totalDurationMonths = years * 12 + months;

  const adjustmentCount = Math.max(0, Math.floor(Math.max(0, totalDurationMonths - varFixedYears * 12) / varPeriodicity));

  useEffect(() => {
    setVarManualRates((currentEntries) => {
      const nextEntries = [...currentEntries];
      const existingByIndex = new Map(nextEntries.map((entry) => [entry.adjustmentIndex, entry]));

      const normalizedEntries: Array<{ adjustmentIndex: number; rate: number }> = [];
      for (let idx = 1; idx <= adjustmentCount; idx += 1) {
        const entry = existingByIndex.get(idx);
        if (entry) {
          normalizedEntries.push(entry);
        } else if (nextEntries.some((item) => item.adjustmentIndex === idx)) {
          normalizedEntries.push({ adjustmentIndex: idx, rate: interestRate });
        }
      }

      if (normalizedEntries.length === nextEntries.length && normalizedEntries.every((entry, index) => entry.adjustmentIndex === nextEntries[index]?.adjustmentIndex && entry.rate === nextEntries[index]?.rate)) {
        return nextEntries;
      }

      return normalizedEntries;
    });
  }, [adjustmentCount, interestRate]);

  // Run Amortization Calculations
  useEffect(() => {
    const principal = Math.max(100, assetCost - downPayment);
    const totalMonths = Math.min(480, Math.max(6, totalDurationMonths)); // 6 months to 40 years bounds

    const rows: AmortizationRow[] = [];
    let remainingBalance = principal;
    let currentRate = interestRate;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;

    for (let month = 1; month <= totalMonths; month++) {
      if (remainingBalance <= 0) break;

      // Variable rate ARM adjustment: only after the initial fixed period has elapsed
      if (rateType === "variable" && month > varFixedYears * 12) {
        const elapsedSinceFixed = month - 1 - (varFixedYears * 12);
        if (elapsedSinceFixed % varPeriodicity === 0) {
          const adjustmentIndex = Math.floor(elapsedSinceFixed / varPeriodicity) + 1;
          const manualEntry = varManualRates.find((entry) => entry.adjustmentIndex === adjustmentIndex);
          if (varRateMode === "manual" && manualEntry && Number.isFinite(manualEntry.rate)) {
            currentRate = Math.max(1.0, Math.min(interestRate + varMaxIncrease, Number(manualEntry.rate)));
          } else {
            if (varTrendScenario === "average") {
              const changeMagnitude = (Math.sin(month / 12) * varVolatility * 1.5) + (0.1 * varVolatility);
              let potentialNewRate = currentRate + changeMagnitude;
              potentialNewRate = Math.max(1.0, Math.min(interestRate + varMaxIncrease, potentialNewRate));
              currentRate = potentialNewRate;
            } else if (varTrendScenario === "worst") {
              let potentialNewRate = currentRate + varVolatility;
              potentialNewRate = Math.max(1.0, Math.min(interestRate + varMaxIncrease, potentialNewRate));
              currentRate = potentialNewRate;
            } else if (varTrendScenario === "best") {
              let potentialNewRate = currentRate - varVolatility;
              potentialNewRate = Math.max(1.0, Math.min(interestRate + varMaxIncrease, potentialNewRate));
              currentRate = potentialNewRate;
            }
          }
        }
      }

      const monthlyRate = (currentRate / 100) / 12;
      
      // Calculate payment using standard formula
      let payment = 0;
      const nRemaining = totalMonths - month + 1;
      
      if (monthlyRate === 0) {
        payment = remainingBalance / nRemaining;
      } else {
        payment = remainingBalance * (monthlyRate * Math.pow(1 + monthlyRate, nRemaining)) / (Math.pow(1 + monthlyRate, nRemaining) - 1);
      }

      // Safeguard
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
    }

    const totalPaid = totalPrincipalPaid + totalInterestPaid;
    const monthlyPayment = rows.length > 0 ? rows[0].payment : 0;

    setSchedule({
      rows,
      totalPrincipalPaid,
      totalInterestPaid,
      totalPaid,
      monthlyPayment,
    });
  }, [
    assetCost,
    downPayment,
    interestRate,
    years,
    months,
    rateType,
    varFixedYears,
    varPeriodicity,
    varMaxIncrease,
    varVolatility,
    varTrendScenario,
    varRateMode,
    varManualRates,
  ]);

  // Generate CSV download
  const handleExportCSV = () => {
    if (!schedule) return;
    const headers = "Month,Payment,Principal Paid,Interest Paid,Remaining Balance,Interest Rate (%)\n";
    const csvContent = schedule.rows.map(r => 
      `${r.month},${r.payment},${r.principalPaid},${r.interestPaid},${r.remainingBalance},${r.currentRate}`
    ).join("\n");
    
    const blob = new Blob([headers + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `loan_schedule_${loanType}_${rateType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Loan Configuration to Database (Premium feature)
  const handleSaveLoan = async () => {
    if (!loanName.trim()) {
      setSaveStatus({ success: false, message: "Please specify a name for this loan configuration" });
      return;
    }
    setIsSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: loanName,
          assetCost,
          downPayment,
          interestRate,
          years,
          months,
          loanType,
          rateType,
          varFixedYears,
          varPeriodicity,
          varMaxIncrease,
          varVolatility,
          varTrendScenario,
          varRateMode,
          varManualRates
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSaveStatus({ success: true, message: `Loan "${loanName}" successfully saved to database!` });
        setLoanName("");
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        setSaveStatus({ success: false, message: data.error || "Failed to save loan info" });
      }
    } catch (err) {
      setSaveStatus({ success: false, message: "Could not reach the backend sandbox server" });
    } finally {
      setIsSaving(false);
    }
  };

  const fetchSavedLoans = async () => {
    setIsLoadingSavedLoans(true);
    setLoadStatus(null);
    try {
      const response = await fetch("/api/loans", { credentials: "include" });
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setSavedLoans([]);
        setSelectedLoadLoanId("");
        setLoadStatus({ success: false, message: data?.error || "Could not load saved configurations." });
        return;
      }

      const loans: SavedLoanConfig[] = (data.loans || []).filter((l: SavedLoanConfig) => l.id !== "loan_standard_demo");
      setSavedLoans(loans);
      setSelectedLoadLoanId((prev) => (prev && loans.some((l) => l.id === prev) ? prev : loans[0]?.id || ""));
      if (loans.length === 0) {
        setLoadStatus({ success: false, message: "No saved configurations found." });
      }
    } catch {
      setSavedLoans([]);
      setSelectedLoadLoanId("");
      setLoadStatus({ success: false, message: "Unable to connect to load saved configurations." });
    } finally {
      setIsLoadingSavedLoans(false);
    }
  };

  useEffect(() => {
    if (!isPremium) {
      return;
    }
    void fetchSavedLoans();
  }, [isPremium]);

  const handleLoadConfiguration = () => {
    const selected = savedLoans.find((loan) => loan.id === selectedLoadLoanId);
    if (!selected) {
      setLoadStatus({ success: false, message: "Select a configuration to load." });
      return;
    }

    setLoanType(selected.loanType || "other");
    setRateType(selected.rateType || "fixed");
    setAssetCost(Number(selected.assetCost) || 0);
    setDownPayment(Number(selected.downPayment) || 0);
    setInterestRate(Number(selected.interestRate) || 0);
    setYears(Number(selected.years) || 0);
    setMonths(Number(selected.months) || 0);
    setVarFixedYears(Number(selected.varFixedYears) || 5);
    setVarPeriodicity(Number(selected.varPeriodicity) || 12);
    setVarMaxIncrease(Number(selected.varMaxIncrease) || 4.0);
    setVarVolatility(Number(selected.varVolatility) || 0.5);
    setVarTrendScenario(selected.varTrendScenario || "average");
    setVarRateMode((selected as SavedLoanConfig & { varRateMode?: "trend" | "manual" }).varRateMode || "trend");
    setVarManualRates((selected as SavedLoanConfig & { varManualRates?: Array<{ adjustmentIndex: number; rate: number }> }).varManualRates || []);
    setLoadStatus({ success: true, message: `Loaded configuration "${selected.name}".` });
    setTimeout(() => setLoadStatus(null), 3500);
  };

  // Setup Plotly Charts
  let chartData: any[] = [];
  let monthlyPaymentChartData: any[] = [];
  let compositionChartData: any[] = [];
  let compositeChartLayout: Record<string, any> = {};
  let monthlyPaymentChartLayout: Record<string, any> = {};
  let crossoverMonth: number | null = null;
  let cumulativePrincipalByMonth: number[] = [];
  let cumulativeInterestByMonth: number[] = [];

  if (schedule) {
    const toLoanPeriodLabel = (month: number) => {
      const year = Math.floor((month - 1) / 12) + 1;
      const monthOfYear = ((month - 1) % 12) + 1;
      return `Year ${year}, Month ${monthOfYear}`;
    };

    const wrapLoanPeriodLabel = (label: string) => label.replace(", ", ",<br>");

    const xArray = schedule.rows.map((r) => toLoanPeriodLabel(r.month));
    const xTickStep = Math.max(1, Math.ceil(xArray.length / 8));
    const xTickVals = xArray.filter((_, idx) => idx % xTickStep === 0 || idx === xArray.length - 1);
    const xTickText = xTickVals.map((label) => wrapLoanPeriodLabel(label));
    const cumulativePrincipalArray = schedule.rows.map((_, i) =>
      schedule.rows.slice(0, i + 1).reduce((sum, row) => sum + row.principalPaid, 0)
    );
    const cumulativeInterestArray = schedule.rows.map((_, i) =>
      schedule.rows.slice(0, i + 1).reduce((sum, row) => sum + row.interestPaid, 0)
    );
    const principalRemainingArray = schedule.rows.map(r => r.remainingBalance);
    cumulativePrincipalByMonth = cumulativePrincipalArray;
    cumulativeInterestByMonth = cumulativeInterestArray;

    // 1. Cumulative lines chart
    chartData = [
      {
        x: xArray,
        y: cumulativePrincipalArray,
        name: "Cumulative Principal Paid",
        type: "scatter",
        mode: "lines+markers",
        marker: { color: "#395756", size: 4 }, // Accent Teal
        line: { color: "#395756", width: 2.5 },
        text: cumulativePrincipalArray.map(v => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        hovertemplate: "Loan Period %{x}<br><b>Cumulative Principal Paid:</b> %{text}<extra></extra>"
      },
      {
        x: xArray,
        y: cumulativeInterestArray,
        name: "Cumulative Interest Paid",
        type: "scatter",
        mode: "lines+markers",
        marker: { color: "#7261a3", size: 4 }, // Accent Purple
        line: { color: "#7261a3", width: 2.5 },
        text: cumulativeInterestArray.map(v => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        hovertemplate: "Loan Period %{x}<br><b>Cumulative Interest Paid:</b> %{text}<extra></extra>"
      },
      {
        x: xArray,
        y: principalRemainingArray,
        name: "Principal Remaining",
        type: "scatter",
        mode: "lines+markers",
        marker: { color: "#A67DB8", size: 4 }, // Accent Lavender
        line: { color: "#A67DB8", width: 2.5 },
        text: principalRemainingArray.map(v => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        hovertemplate: "Loan Period %{x}<br><b>Principal Remaining:</b> %{text}<extra></extra>"
      }
    ];

    // 2. Monthly payment trend chart
    const monthlyPaymentSeries = rateType === "fixed"
      ? schedule.rows.map(() => schedule.rows[0]?.payment ?? 0)
      : schedule.rows.map((r) => r.payment);

    monthlyPaymentChartData = [
      {
        x: xArray,
        y: monthlyPaymentSeries,
        name: "Monthly Payment",
        type: "scatter",
        mode: "lines+markers",
        marker: { color: "#1b3022", size: 4 },
        line: { color: "#1b3022", width: 2.5 },
        text: schedule.rows.map((r) => `$${r.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`),
        customdata: schedule.rows.map((r) => r.currentRate.toFixed(2) + "%"),
        hovertemplate: "Loan Period %{x}<br><b>Payment:</b> %{text}<br><b>Rate:</b> %{customdata}<extra></extra>",
      }
    ];

    monthlyPaymentChartLayout = {
      title: {
        text: "Monthly Payment Amount Over Time",
        font: { family: "Space Grotesk, sans-serif", size: 14, color: "#1b3022" }
      },
      xaxis: {
        title: "Loan Period",
        nticks: 8,
        tickmode: "array",
        tickvals: xTickVals,
        ticktext: xTickText,
        tickangle: 0,
        automargin: true,
        gridcolor: "#f1f5f9",
        tickfont: { color: "#4f5d75", size: 10 }
      },
      yaxis: {
        title: {
          text: "Monthly Payment ($)",
          standoff: 22,
        },
        gridcolor: "#f1f5f9",
        tickformat: "$,.2f",
        tickfont: { color: "#4f5d75", size: 10 }
      },
      hovermode: "x unified",
      legend: { x: 1.02, y: 1, orientation: "v", xanchor: "left", yanchor: "top" },
      height: 300,
      margin: { l: 72, r: 120, t: 30, b: 40 }
    };

    // 3. Composition stacked area chart ratio mapping
    const interestProportion = schedule.rows.map(r => {
      const sum = r.principalPaid + r.interestPaid;
      if (sum === 0) return 0;
      return (r.interestPaid / sum) * 100;
    });

    const principalProportion = schedule.rows.map(r => {
      const sum = r.principalPaid + r.interestPaid;
      if (sum === 0) return 0;
      return (r.principalPaid / sum) * 100;
    });

    compositionChartData = [
      {
        x: xArray,
        y: interestProportion,
        name: "Interest portion",
        type: "scatter",
        mode: "lines",
        fill: "tozeroy",
        fillcolor: "rgba(114, 97, 163, 0.22)", // Accent Purple translucent
        line: { color: "#7261a3", width: 1.5 },
        text: principalProportion.map(p => p.toFixed(2) + "%"),
        customdata: interestProportion.map(p => p.toFixed(2) + "%"),
        hovertemplate: "Loan Period %{x}<br><b>Principal Portion:</b> %{text}<br><b>Interest Portion:</b> %{customdata}<extra></extra>"
      },
      {
        x: xArray,
        y: Array(schedule.rows.length).fill(100),
        name: "Principal portion",
        type: "scatter",
        mode: "lines",
        fill: "tonexty",
        fillcolor: "rgba(57, 87, 86, 0.22)", // Accent Teal translucent
        line: { color: "#395756", width: 1.5 },
        text: principalProportion.map(p => p.toFixed(2) + "%"),
        customdata: interestProportion.map(p => p.toFixed(2) + "%"),
        hovertemplate: "Loan Period %{x}<br><b>Principal Portion:</b> %{text}<br><b>Interest Portion:</b> %{customdata}<extra></extra>"
      },
      {
        x: xArray,
        y: Array(schedule.rows.length).fill(50),
        name: "50% Composition Split",
        type: "scatter",
        mode: "lines",
        line: { color: "#A67DB8", width: 2, dash: "dash" }, // Accent Lavender dashed line
        hovertemplate: "50% Composition Boundary Line<extra></extra>"
      }
    ];

    compositeChartLayout = {
      title: {
        text: "Monthly Payment Composition Over Time (%)",
        font: { family: "Space Grotesk, sans-serif", size: 14, color: "#1b3022" }
      },
      xaxis: {
        title: "Loan Period",
        nticks: 8,
        tickmode: "array",
        tickvals: xTickVals,
        ticktext: xTickText,
        tickangle: 0,
        automargin: true,
        gridcolor: "#f1f5f9",
        tickfont: { color: "#4f5d75", size: 10 }
      },
      yaxis: {
        title: "Composition Split %",
        range: [0, 100],
        gridcolor: "#f1f5f9",
        tickfont: { color: "#4f5d75", size: 10 },
        ticksuffix: "%"
      },
      legend: { x: 1.02, y: 1, orientation: "v", xanchor: "left", yanchor: "top" },
      height: 290,
      margin: { l: 50, r: 160, t: 30, b: 40 }
    };

    // Calculate crossover month where Principal portion > Interest portion
    const crossoverRow = schedule.rows.find(r => r.principalPaid > r.interestPaid);
    if (crossoverRow) {
      crossoverMonth = crossoverRow.month;
    }
  }

  const chartLayout = {
    title: {
      text: "Cumulative Loan Progress Over Time",
      font: { family: "Space Grotesk, sans-serif", size: 15, color: "#1b3022" }
    },
    xaxis: {
      title: "Loan Period",
      nticks: 8,
      tickmode: "array",
      tickvals: schedule ? schedule.rows.filter((_, idx) => idx % Math.max(1, Math.ceil(schedule.rows.length / 8)) === 0 || idx === schedule.rows.length - 1).map((r) => `Year ${Math.floor((r.month - 1) / 12) + 1}, Month ${((r.month - 1) % 12) + 1}`) : [],
      ticktext: schedule ? schedule.rows.filter((_, idx) => idx % Math.max(1, Math.ceil(schedule.rows.length / 8)) === 0 || idx === schedule.rows.length - 1).map((r) => `Year ${Math.floor((r.month - 1) / 12) + 1},<br>Month ${((r.month - 1) % 12) + 1}`) : [],
      tickangle: 0,
      automargin: true,
      gridcolor: "#f5f5f5",
      tickfont: { color: "#4f5d75", size: 10 },
      showspikes: true,
      spikemode: "across",
      spikesnap: "cursor",
      spikethickness: 1,
      spikecolor: "#4f5d75"
    },
    yaxis: {
      title: "Cumulative Amount ($)",
      gridcolor: "#f5f5f5",
      tickfont: { color: "#4f5d75", size: 10 }
    },
    hovermode: "x unified",
    legend: { x: 1.02, y: 1, orientation: "v", xanchor: "left", yanchor: "top" },
    height: 340,
    margin: { l: 50, r: 160, t: 40, b: 40 }
  };

  const getARMReadableString = () => {
    const adjustText = varPeriodicity === 6 ? "6 months" : varPeriodicity === 12 ? "year" : "2 years";
    const armTermText = varPeriodicity === 6 ? "0.5" : varPeriodicity === 12 ? "1" : "2";
    return `Fixed for ${varFixedYears} years, followed by adjustments every ${adjustText} (ARM ${varFixedYears}/${armTermText})`;
  };

  outputsRef.current = {
    charts: {
      cumulativeProgress: {
        intent: "Shows cumulative principal paid, cumulative interest paid, and remaining principal over the loan timeline.",
        data: chartData,
        layout: chartLayout,
      },
      monthlyPaymentTrend: {
        intent: "Shows how monthly payment amounts evolve across loan periods and changing rates.",
        data: monthlyPaymentChartData,
        layout: monthlyPaymentChartLayout,
      },
      paymentComposition: {
        intent: "Shows principal-vs-interest composition of each payment over time as percentages.",
        data: compositionChartData,
        layout: compositeChartLayout,
      },
    },
    summary: schedule
      ? {
          monthlyPayment: schedule.monthlyPayment,
          totalPrincipalPaid: schedule.totalPrincipalPaid,
          totalInterestPaid: schedule.totalInterestPaid,
          totalPaid: schedule.totalPaid,
          crossoverMonth,
        }
      : {},
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Structural Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-light-green border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1b3022] font-display flex items-center gap-2">
            <Calculator className="w-8 h-8 text-[#1b3022]" /> Loan Amortization Calculator
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View the amortization schedule of a loan to see how the principal is paid over time.
          </p>
        </div>
      </div>

      {/* Loan Type Fast Switch */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-2 border border-slate-200 rounded-xl max-w-2xl">
        {(["mortgage", "education", "auto", "other"] as const).map((type) => (
          <button
            key={type}
            onClick={() => handleLoanTypeSelect(type)}
            className={`py-2 px-3 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
              loanType === type
                ? "bg-brand-green text-white shadow-sm"
                : "bg-transparent text-slate-600 hover:bg-slate-50"
            }`}
          >
            {type === "other" ? "Other Loans" : `${type}`}
          </button>
        ))}
      </div>

      {/* Main Form + Analytics Division */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Settings (Span 4) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-xs">
          <h3 className="font-bold text-brand-green border-b border-slate-100 pb-2 text-sm tracking-wide uppercase font-display">
            Loan Input Parameters
          </h3>

          <div className="space-y-4">
            {/* Rate Type toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Interest Structure
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-lg border border-slate-150">
                <button
                  type="button"
                  onClick={() => setRateType("fixed")}
                  className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    rateType === "fixed"
                      ? "bg-slate-200 text-brand-green shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Fixed Rate
                </button>
                <button
                  type="button"
                  onClick={() => setRateType("variable")}
                  className={`py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                    rateType === "variable"
                      ? "bg-slate-200 text-brand-green shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Variable Rate
                </button>
              </div>
            </div>

            {/* Principal calculations */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase mb-1">Asset Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">$</span>
                  <input
                    type="number"
                    className="w-full text-sm pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                    value={assetCost}
                    onChange={(e) => setAssetCost(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 uppercase mb-1">Down Payment</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">$</span>
                  <input
                    type="number"
                    className="w-full text-sm pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                    value={downPayment}
                    onChange={(e) => setDownPayment(Math.max(0, Math.min(assetCost, Number(e.target.value))))}
                  />
                </div>
              </div>
            </div>

            {/* Principal Balance Info Pill */}
            <div className="bg-[#1b3022]/5 border border-[#1b3022]/10 rounded-lg py-2 px-3 flex justify-between items-center text-xs text-brand-green">
              <span className="font-medium">Calculated Principal:</span>
              <span className="font-mono font-bold">${(assetCost - downPayment).toLocaleString()}</span>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-xs font-medium text-slate-600 uppercase mb-1">
                {rateType === "fixed" ? "Fixed Interest Rate" : "Initial Interest Rate"} (% Year)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">
                  <Percent className="w-4 h-4 text-slate-600" />
                </span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full text-sm pl-10 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                />
              </div>
            </div>

            {/* Duration Slider / Picker */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600 uppercase">Duration</span>
                <span className="font-mono text-brand-green font-bold bg-[#1b3022]/10 px-2 py-0.5 rounded-sm">
                  {years}y {months > 0 ? `${months}m` : ""} ({totalDurationMonths} Mos)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-600 uppercase mb-1">Years (0 - 40)</label>
                  <input
                    type="number"
                    max={40}
                    min={0}
                    className="w-full text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                    value={years}
                    onChange={(e) => {
                      const v = Math.min(40, Math.max(0, parseInt(e.target.value) || 0));
                      setYears(v);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-600 uppercase mb-1">Months (0 - 11)</label>
                  <input
                    type="number"
                    max={11}
                    min={0}
                    className="w-full text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                    value={months}
                    onChange={(e) => {
                      const m = Math.min(11, Math.max(0, parseInt(e.target.value) || 0));
                      setMonths(m);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ARM Options Input block */}
            {rateType === "variable" && (
              <div className="bg-[#1b3022]/5 border border-[#395756]/20 p-4 rounded-xl space-y-3">
                <div className="text-xs font-bold text-[#1b3022] flex items-center gap-1 font-display">
                  <TrendingUp className="w-3.5 h-3.5" /> Adjustments Configuration
                </div>

                <div className="bg-white border border-[#395756]/15 rounded-lg p-2 text-[11px] text-slate-700 font-medium">
                  <span className="text-[#395756] font-bold">Structured Target:</span><br />
                  <span className="font-mono text-xs">{getARMReadableString()}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                      Fixed Period
                    </label>
                    <select
                      className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-mono"
                      value={varFixedYears}
                      onChange={(e) => setVarFixedYears(Number(e.target.value))}
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
                      value={varPeriodicity}
                      onChange={(e) => setVarPeriodicity(Number(e.target.value))}
                    >
                      <option value={6}>6 Months (0.5y)</option>
                      <option value={12}>1 Year (1.0y)</option>
                      <option value={24}>2 Years (2.0y)</option>
                    </select>
                  </div>
                </div>

                {/* Rate Increase Lifetime Cap */}
                <div className="space-y-1.5 border-t border-slate-150 pt-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Lifetime Rate Change Ceiling
                    </label>
                    <span className="text-[10px] font-bold text-[#1b3022] font-mono bg-[#1b3022]/10 px-1.5 py-0.5 rounded">
                      +{varMaxIncrease.toFixed(1)}% limit above initial rate
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">%</span>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={varMaxIncrease}
                      onChange={(e) => setVarMaxIncrease(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1b3022] font-mono text-slate-800"
                    />
                  </div>
                </div>

                {/* Volatility adjustment factor */}
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      Max Rate Change Per Adjustment Era
                    </label>
                    <span className="text-[10px] font-bold text-[#1b3022] font-mono bg-[#1b3022]/10 px-1.5 py-0.5 rounded">
                      &plusmn;{varVolatility.toFixed(2)}% change
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">%</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={varVolatility}
                      onChange={(e) => setVarVolatility(Math.max(0, Number(e.target.value) || 0))}
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
                    value={varTrendScenario}
                    onChange={(e) => setVarTrendScenario(e.target.value as "best" | "average" | "worst")}
                  >
                    <option value="best">Best Case (Rates Always Go Down)</option>
                    <option value="average">Average Case (Fluctuations)</option>
                    <option value="worst">Worst Case (Rates Always Go Up)</option>
                  </select>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                      Adjustment Method
                    </label>
                    <select
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-brand-green font-sans font-medium text-slate-700"
                      value={varRateMode}
                      onChange={(e) => setVarRateMode(e.target.value as "trend" | "manual")}
                    >
                      <option value="trend">Projected Trend</option>
                      <option value="manual">Manual Entry</option>
                    </select>
                  </div>

                  {varRateMode === "manual" && (
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        Manual adjustment rates
                      </div>
                      <div className="text-[10px] text-slate-500 leading-relaxed">
                        Enter the rates for each adjustment period. Missing values will be projected from the trend logic.
                      </div>
                      {Array.from({ length: Math.max(0, Math.floor(Math.max(0, totalDurationMonths - varFixedYears * 12) / varPeriodicity)) }, (_, index) => {
                        const adjustmentIndex = index + 1;
                        const entry = varManualRates.find((item) => item.adjustmentIndex === adjustmentIndex);
                        return (
                          <div key={adjustmentIndex} className="grid grid-cols-[1fr_auto] items-center gap-2">
                            <label className="text-[10px] font-medium text-slate-600">
                              Adjusted Rate {adjustmentIndex}
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-[10px]">%</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={entry ? entry.rate : ""}
                                onChange={(e) => {
                                  const rawValue = e.target.value;
                                  if (rawValue === "") {
                                    setVarManualRates((current) => current.filter((item) => item.adjustmentIndex !== adjustmentIndex));
                                    return;
                                  }

                                  const nextValue = Number(rawValue);
                                  if (Number.isNaN(nextValue)) {
                                    return;
                                  }

                                  setVarManualRates((current) => {
                                    const existing = current.find((item) => item.adjustmentIndex === adjustmentIndex);
                                    if (existing) {
                                      return current.map((item) => item.adjustmentIndex === adjustmentIndex ? { ...item, rate: nextValue } : item);
                                    }
                                    return [...current, { adjustmentIndex, rate: nextValue }];
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

            {/* Save Loan Widget */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase font-display flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-accent-teal" /> Save this Configuration
              </h4>
              
              {isPremium ? (
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Give this loan a name to securely save it for future use in the payment scenarios page.
                  </p>
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. Dream House Option A"
                      className="w-full text-xs px-2.5 py-2 bg-white border border-slate-250 rounded-lg focus:outline-hidden focus:border-brand-green font-sans"
                      value={loanName}
                      onChange={(e) => setLoanName(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={handleSaveLoan}
                    disabled={isSaving || !loanName.trim()}
                    className="w-full py-1.5 bg-accent-teal hover:bg-accent-slate disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSaving ? "Saving..." : "Save Loan in Database"}
                  </button>
                  {saveStatus && (
                    <div className={`text-[10px] p-2 rounded-lg font-medium ${
                      saveStatus.success ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                    }`}>
                      {saveStatus.message}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#1b3022]/5 rounded-xl p-3.5 border border-dashed border-[#1b3022]/20 text-center">
                  <div className="inline-flex p-1.5 bg-white text-brand-green rounded-full shadow-xs mb-2">
                    <Sparkles className="w-4 h-4 text-brand-green animate-pulse" />
                  </div>
                  <h5 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Sign In To Save</h5>
                  <p className="text-[10px] text-slate-500 leading-normal mt-1 mb-2.5">
                    Signed-in users can save loan configurations for payment scenarios.
                  </p>
                  <button
                    onClick={() => setShowSignInPrompt(true)}
                    className="w-full py-1.5 bg-[#1b3022] text-white hover:bg-[#395756] text-[10px] font-bold uppercase tracking-wider rounded-md transition cursor-pointer"
                  >
                    Open Profile
                  </button>
                </div>
              )}
            </div>

            {/* Load Loan Configuration */}
            <div className="border-t border-slate-100 pt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase font-display flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent-slate" /> Load a Configuration
              </h4>

              {isPremium ? (
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Load a previously saved loan configuration into this calculator.
                  </p>
                  <select
                    className="w-full text-xs px-2.5 py-2 bg-white border border-slate-250 rounded-lg focus:outline-hidden focus:border-brand-green font-sans"
                    value={selectedLoadLoanId}
                    onChange={(e) => setSelectedLoadLoanId(e.target.value)}
                    disabled={isLoadingSavedLoans || savedLoans.length === 0}
                  >
                    {savedLoans.length === 0 ? (
                      <option value="">No saved configurations</option>
                    ) : (
                      savedLoans.map((loan) => (
                        <option key={loan.id} value={loan.id}>
                          {loan.name}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={fetchSavedLoans}
                      disabled={isLoadingSavedLoans}
                      className="w-full py-1.5 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-60 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      {isLoadingSavedLoans ? "Refreshing..." : "Refresh List"}
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadConfiguration}
                      disabled={isLoadingSavedLoans || !selectedLoadLoanId}
                      className="w-full py-1.5 bg-accent-slate hover:bg-accent-teal disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      Load Selected
                    </button>
                  </div>
                  {loadStatus && (
                    <div className={`text-[10px] p-2 rounded-lg font-medium ${
                      loadStatus.success ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                    }`}>
                      {loadStatus.message}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#1b3022]/5 rounded-xl p-3.5 border border-dashed border-[#1b3022]/20 text-center">
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Sign in to load previously saved configurations.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Analytics dashboards (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Summary KPIs */}
          {schedule && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm border-l-4 border-l-[#1b3022]">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Initial Payment</div>
                  <div className="text-xl font-bold font-display text-[#1b3022] mt-1">
                    ${schedule.monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Per month</div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm border-l-4 border-l-[#395756]">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Principal Borrowed</div>
                  <div className="text-xl font-bold font-display text-[#395756] mt-1">
                    ${schedule.totalPrincipalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm border-l-4 border-l-[#7261a3]">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Total Interest Cost</div>
                  <div className="text-xl font-bold font-display text-[#7261a3] mt-1">
                    ${schedule.totalInterestPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm border-l-4 border-l-[#A67DB8]">
                  <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">Cumulative Total</div>
                  <div className="text-xl font-bold font-display text-[#A67DB8] mt-1">
                    ${schedule.totalPaid.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Principal + Interest</div>
                </div>
              </div>
            </div>
          )}

          <p className="mb-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              Monthly payment amounts do not include escrow or fees like taxes, insurance, private mortgage insurance (PMI), or home owners association (HOA) fees.
            </span>
          </p>

          {/* Interactive Plotly Amortization Chart */}
          <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
            <div>
              <h4 className="font-bold text-[#1b3022] font-display text-sm tracking-wide uppercase">Amortization Schedule with Cumulative Amounts</h4>
              <p className="text-xs text-slate-600 font-sans">The cumulative principal and interest paid over time, with the decreasing principal balance.</p>
            </div>
            {schedule && (
              <PlotlyChart id="amortization-chart" data={chartData} layout={chartLayout} />
            )}
          </div>

          {/* Monthly Payment Over Time Chart */}
          {schedule && (
            <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h4 className="font-bold text-[#1b3022] font-display text-sm tracking-wide uppercase">Monthly Payment Amount Over Time</h4>
                <p className="text-xs text-slate-600 font-sans">Month-by-month payment requirement across the full loan duration.</p>
              </div>
              <PlotlyChart id="monthly-payment-chart" data={monthlyPaymentChartData} layout={monthlyPaymentChartLayout} />
            </div>
          )}

          {/* Stacked Area Chart for Payment Composition */}
          {schedule && (
            <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-[#1b3022] font-display text-sm tracking-wide uppercase">Monthly Payment Composition Over Time</h4>
                  <p className="text-xs text-slate-600 font-sans">Stacked ratio between principal and interest components of the monthly payment.</p>
                </div>
                {crossoverMonth !== null && (
                  <div className="bg-[#395756]/10 border border-[#395756]/20 py-1.5 px-3 rounded-lg text-xs font-semibold text-[#1b3022] font-sans flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#395756]" />
                    <span>Crosses 50% Principal milestone in Month {crossoverMonth}</span>
                  </div>
                )}
              </div>
              
              <PlotlyChart id="payment-composition-chart" data={compositionChartData} layout={compositeChartLayout} />
            </div>
          )}

          {/* Granular Table View */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h4 className="font-bold text-slate-900 font-display">Amortization Schedule Details</h4>
                <p className="text-slate-500 text-xs">Details of every payment period</p>
              </div>
              <button 
                id="export-schedule"
                onClick={handleExportCSV}
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
                  {schedule?.rows.map((row, idx) => (
                    <tr key={row.month} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-bold text-brand-green">Month {row.month}</td>
                      <td className="py-2.5 px-4 text-slate-700">Year {Math.floor((row.month - 1) / 12) + 1}, Month {((row.month - 1) % 12) + 1}</td>
                      <td className="py-2.5 px-4 text-slate-600">{row.currentRate.toFixed(2)}%</td>
                      <td className="py-2.5 px-4 font-bold">${row.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-4 text-accent-teal">${row.principalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-4 text-accent-purple">${row.interestPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-4 text-slate-700">${cumulativePrincipalByMonth[idx].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-4 text-slate-700">${cumulativeInterestByMonth[idx].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">${row.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-4 text-slate-700">{(assetCost > 0 ? (row.remainingBalance / assetCost) * 100 : 0).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <SignInRequiredModal
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        onSuccess={() => onUpgrade?.()}
      />
    </div>
  );
}
