import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  ArrowRight,
  Info,
  Plus, 
  Trash2,
  Play,
  CheckCircle2,
  CalendarDays,
  Coins,
  Download
} from "lucide-react";
import PlotlyChart from "./PlotlyChart";

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
  varFixedYears: number;
  varPeriodicity: number;
  varMaxIncrease: number;
  varVolatility: number;
  varTrendScenario?: "best" | "average" | "worst";
  varRateMode?: "trend" | "manual";
  varManualRates?: Array<{ adjustmentIndex: number; rate: number }>;
}

interface ExtraPayment {
  id: string;
  type: "single" | "recurring";
  amount: number;
  period: number; // single
  startPeriod: number; // recurring
  endPeriod: number; // recurring
}

interface SavedPaymentSchedule {
  id: string;
  name: string;
  loanId: string;
  extraPayments: ExtraPayment[];
}

interface PageProps {
  isPremium?: boolean;
  onUpgrade?: () => void;
}

interface AgentSetInputEventDetail {
  page?: string;
  state?: Record<string, unknown>;
}

export default function PaymentScenariosPage({ isPremium = false, onUpgrade }: PageProps) {
  const [loans, setLoans] = useState<LoanOption[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  
  // Extra Payments List
  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>([
    { id: "init_1", type: "recurring", amount: 200, period: 12, startPeriod: 1, endPeriod: 120 }
  ]);

  // Form Fields for adding an Extra Payment
  const [newType, setNewType] = useState<"single" | "recurring">("single");
  const [newAmount, setNewAmount] = useState(150);
  const [newPeriod, setNewPeriod] = useState(12);
  const [newStartPeriod, setNewStartPeriod] = useState(1);
  const [newEndPeriod, setNewEndPeriod] = useState(120);

  // Simulation Results
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState("");
  const [savedSchedules, setSavedSchedules] = useState<SavedPaymentSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState<{ success: boolean; message: string } | null>(null);
  const outputsRef = useRef<Record<string, unknown>>({
    charts: {},
    summary: {},
  });

  // Listen for external input updates via the "set_input" event and
  // update the local component state accordingly. This allows the
  // payment scenarios page to respond to partial state updates coming
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

    const parseExtraPayment = (raw: unknown): ExtraPayment | null => {
      if (!raw || typeof raw !== "object") {
        return null;
      }

      const candidate = raw as Record<string, unknown>;
      const type = candidate.type === "recurring" ? "recurring" : candidate.type === "single" ? "single" : null;
      const amount = toNumber(candidate.amount);
      const period = toNumber(candidate.period);
      const startPeriod = toNumber(candidate.startPeriod);
      const endPeriod = toNumber(candidate.endPeriod);

      if (!type || amount === null || period === null || startPeriod === null || endPeriod === null) {
        return null;
      }

      return {
        id: typeof candidate.id === "string" && candidate.id ? candidate.id : `ep_${Math.random().toString(36).slice(2, 10)}`,
        type,
        amount: Math.max(0, amount),
        period: Math.max(1, Math.trunc(period)),
        startPeriod: Math.max(1, Math.trunc(startPeriod)),
        endPeriod: Math.max(1, Math.trunc(endPeriod)),
      };
    };

    const handleSetInputEvent = (event: Event) => {
      const detail = (event as CustomEvent<AgentSetInputEventDetail>).detail;
      if (!detail || detail.page !== "paymentScenarios" || !detail.state || typeof detail.state !== "object") {
        return;
      }

      const state = detail.state;

      if (typeof state.selectedLoanId === "string") {
        setSelectedLoanId(state.selectedLoanId);
      }

      if (typeof state.newType === "string" && ["single", "recurring"].includes(state.newType)) {
        setNewType(state.newType as "single" | "recurring");
      }

      const newAmountValue = toNumber(state.newAmount);
      if (newAmountValue !== null) {
        setNewAmount(Math.max(1, newAmountValue));
      }

      const newPeriodValue = toNumber(state.newPeriod);
      if (newPeriodValue !== null) {
        setNewPeriod(Math.max(1, Math.trunc(newPeriodValue)));
      }

      const newStartPeriodValue = toNumber(state.newStartPeriod);
      if (newStartPeriodValue !== null) {
        setNewStartPeriod(Math.max(1, Math.trunc(newStartPeriodValue)));
      }

      const newEndPeriodValue = toNumber(state.newEndPeriod);
      if (newEndPeriodValue !== null) {
        setNewEndPeriod(Math.max(1, Math.trunc(newEndPeriodValue)));
      }

      if (typeof state.scheduleName === "string") {
        setScheduleName(state.scheduleName);
      }

      if (typeof state.selectedScheduleId === "string") {
        setSelectedScheduleId(state.selectedScheduleId);
      }

      if (Array.isArray(state.extraPayments)) {
        const parsed = state.extraPayments
          .map((item) => parseExtraPayment(item))
          .filter((item): item is ExtraPayment => item !== null);

        if (parsed.length > 0) {
          setExtraPayments(parsed);
        }
      }
    };

    window.addEventListener("agent:set_input", handleSetInputEvent as EventListener);
    return () => {
      window.removeEventListener("agent:set_input", handleSetInputEvent as EventListener);
    };
  }, []);

  // Handle agent:collect_state events to provide the current payment scenarios page state.
  useEffect(() => {
    const handleCollectState = (event: Event) => {
      const detail = (event as CustomEvent<{ page?: string }>).detail;
      if (!detail || detail.page !== "paymentScenarios") {
        return;
      }

      window.dispatchEvent(new CustomEvent("agent:state_collected", {
        detail: {
          page: "paymentScenarios",
          state: {
            selectedLoanId,
            extraPayments,
            newType,
            newAmount,
            newPeriod,
            newStartPeriod,
            newEndPeriod,
            scheduleName,
            selectedScheduleId,
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
    extraPayments,
    newType,
    newAmount,
    newPeriod,
    newStartPeriod,
    newEndPeriod,
    scheduleName,
    selectedScheduleId,
  ]);

  // Fetch saved loans
  const fetchLoans = async () => {
    setIsLoadingLoans(true);
    try {
      const response = await fetch("/api/loans");
      const data = await response.json();
      if (response.ok && data.success) {
        setLoans(data.loans || []);
        if (data.loans && data.loans.length > 0) {
          // Prefer a user-owned loan first so schedules can be saved against it
          const defaultLoan = data.loans.find((l: any) => l.id !== "loan_standard_demo") || data.loans[0];
          setSelectedLoanId(defaultLoan.id);
        }
      }
    } catch (err) {
      console.error("Failed to load saved projects", err);
    } finally {
      setIsLoadingLoans(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  // Trigger simulation when selected loan or extra payments change
  const handleSimulate = async (customLoanOverride?: LoanOption) => {
    const loanToRun = customLoanOverride || loans.find(l => l.id === selectedLoanId);
    if (!loanToRun) {
      setSimError("Please select a valid loan configuration to model.");
      return;
    }

    setIsSimulating(true);
    setSimError(null);

    try {
      const response = await fetch("/api/loans/scenarios-calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanDetails: loanToRun,
          extraPayments: extraPayments
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSimulationResult(data);
      } else {
        setSimError(data.error || "Scenario calculations failed.");
      }
    } catch (err) {
      setSimError("Could not connect to simulation microservice.");
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    if (loans.length > 0 && selectedLoanId) {
      handleSimulate();
    }
  }, [selectedLoanId, loans]);

  const fetchSavedSchedules = async (loanId: string) => {
    if (!loanId || !isPremium) {
      setSavedSchedules([]);
      setSelectedScheduleId("");
      return;
    }

    setIsLoadingSchedules(true);
    setScheduleStatus(null);
    try {
      const response = await fetch(`/api/payment-schedules?loanId=${encodeURIComponent(loanId)}`);
      const data = await response.json();
      if (!response.ok || !data?.success) {
        setSavedSchedules([]);
        setSelectedScheduleId("");
        setScheduleStatus({ success: false, message: data?.error || "Unable to load saved payment schedules." });
        return;
      }

      const schedules: SavedPaymentSchedule[] = (data.schedules || []).map((schedule: any) => ({
        id: schedule.id,
        name: schedule.name,
        loanId: schedule.loanId,
        extraPayments: Array.isArray(schedule.extraPayments)
          ? schedule.extraPayments.map((payment: any, idx: number) => ({
              id: String(payment.id || `loaded_${idx}_${Date.now()}`),
              type: payment.type === "recurring" ? "recurring" : "single",
              amount: Number(payment.amount) || 0,
              period: Number(payment.period) || 1,
              startPeriod: Number(payment.startPeriod) || 1,
              endPeriod: Number(payment.endPeriod) || 1,
            }))
          : [],
      }));

      setSavedSchedules(schedules);
      setSelectedScheduleId((prev) => (prev && schedules.some((s) => s.id === prev) ? prev : schedules[0]?.id || ""));
    } catch {
      setSavedSchedules([]);
      setSelectedScheduleId("");
      setScheduleStatus({ success: false, message: "Unable to connect to load payment schedules." });
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  useEffect(() => {
    if (!selectedLoanId || !isPremium) {
      setSavedSchedules([]);
      setSelectedScheduleId("");
      return;
    }

    void fetchSavedSchedules(selectedLoanId);
  }, [selectedLoanId, isPremium]);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId);
  const maxPeriodFromLoan = selectedLoan
    ? Math.min(480, Math.max(6, (Number(selectedLoan.years) || 0) * 12 + (Number(selectedLoan.months) || 0)))
    : 120;
  const maxPeriod = simulationResult?.baseline?.durationMonths
    ? Math.max(1, Number(simulationResult.baseline.durationMonths))
    : maxPeriodFromLoan;

  useEffect(() => {
    setNewPeriod((prev) => Math.max(1, Math.min(maxPeriod, Number(prev) || 1)));
    setNewStartPeriod((prev) => Math.max(1, Math.min(maxPeriod, Number(prev) || 1)));
    setNewEndPeriod((prev) => {
      if (!Number.isFinite(prev) || prev < 1) return maxPeriod;
      return Math.max(1, Math.min(maxPeriod, prev));
    });
  }, [maxPeriod]);

  const handleAddExtraPayment = () => {
    const cappedSinglePeriod = Math.max(1, Math.min(maxPeriod, Number(newPeriod) || 1));
    const cappedStartPeriod = Math.max(1, Math.min(maxPeriod, Number(newStartPeriod) || 1));
    const endRaw = Number(newEndPeriod);
    const endWithDefault = Number.isFinite(endRaw) && endRaw >= 1 ? endRaw : maxPeriod;
    const cappedEndPeriod = Math.max(cappedStartPeriod, Math.min(maxPeriod, endWithDefault));

    const item: ExtraPayment = {
      id: "ep_" + Math.random().toString(36).substring(2, 9),
      type: newType,
      amount: newAmount,
      period: cappedSinglePeriod,
      startPeriod: cappedStartPeriod,
      endPeriod: cappedEndPeriod
    };
    setExtraPayments(prev => [...prev, item]);
    // Reset form defaults slightly
    setNewAmount(150);
    setNewEndPeriod(maxPeriod);
  };

  const handleRemoveExtraPayment = (id: string) => {
    setExtraPayments(prev => prev.filter(x => x.id !== id));
  };

  const handleSavePaymentSchedule = async () => {
    if (!isPremium) {
      setScheduleStatus({ success: false, message: "Sign in is required to save payment schedules." });
      return;
    }

    if (!selectedLoanId) {
      setScheduleStatus({ success: false, message: "Select a loan before saving a payment schedule." });
      return;
    }

    const normalizedName = scheduleName.trim();
    if (!normalizedName) {
      setScheduleStatus({ success: false, message: "Enter a payment schedule name first." });
      return;
    }

    setIsSavingSchedule(true);
    setScheduleStatus(null);

    try {
      const response = await fetch("/api/payment-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: normalizedName,
          loanId: selectedLoanId,
          extraPayments,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        setScheduleStatus({ success: false, message: data?.error || "Failed to save payment schedule." });
        return;
      }

      const replaced = Boolean(data.replaced);
      setScheduleStatus({
        success: true,
        message: replaced
          ? `Payment schedule "${normalizedName}" replaced.`
          : `Payment schedule "${normalizedName}" saved.`,
      });
      setScheduleName("");
      await fetchSavedSchedules(selectedLoanId);
      if (data?.schedule?.id) {
        setSelectedScheduleId(String(data.schedule.id));
      }
    } catch {
      setScheduleStatus({ success: false, message: "Could not connect to save payment schedule." });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleLoadPaymentSchedule = () => {
    const schedule = savedSchedules.find((s) => s.id === selectedScheduleId);
    if (!schedule) {
      setScheduleStatus({ success: false, message: "Select a saved payment schedule to load." });
      return;
    }

    setExtraPayments(
      schedule.extraPayments.map((payment, idx) => ({
        id: String(payment.id || `loaded_${idx}_${Math.random().toString(36).slice(2, 8)}`),
        type: payment.type === "recurring" ? "recurring" : "single",
        amount: Number(payment.amount) || 0,
        period: Number(payment.period) || 1,
        startPeriod: Number(payment.startPeriod) || 1,
        endPeriod: Number(payment.endPeriod) || 1,
      })),
    );
    setScheduleStatus({ success: true, message: `Loaded payment schedule "${schedule.name}".` });
    void handleSimulate();
  };

  // Interactive Plotly graph setup representing Remaining Balances over time
  let chartData: any[] = [];
  let chartLayout: Record<string, any> = {};
  let paidChartData: any[] = [];
  let paidChartLayout: Record<string, any> = {};

  if (simulationResult) {
    const baselineBalances = simulationResult.baseline.rows.map((r: any) => r.remainingBalance);
    const scenarioBalances = simulationResult.scenario.rows.map((r: any) => r.remainingBalance);
    const monthsArray = Array.from({ length: Math.max(baselineBalances.length, scenarioBalances.length) }, (_, i) => i + 1);
    const loanPeriodLabels = monthsArray.map((month) => {
      const year = Math.floor((month - 1) / 12) + 1;
      const monthOfYear = ((month - 1) % 12) + 1;
      return `Year ${year}, Month ${monthOfYear}`;
    });
    const xTickStep = Math.max(1, Math.ceil(loanPeriodLabels.length / 8));
    const xTickVals = loanPeriodLabels.filter((_, idx) => idx % xTickStep === 0 || idx === loanPeriodLabels.length - 1);
    const xTickText = xTickVals.map((label) => label.replace(", ", ",<br>"));

    // Padding scenario balance array to end at 0 quickly once fully repaid
    const paddedScenarioBalances = monthsArray.map((m, idx) => {
      if (idx < scenarioBalances.length) {
        return scenarioBalances[idx];
      }
      return 0;
    });

    const paddedBaselineBalances = monthsArray.map((m, idx) => {
      if (idx < baselineBalances.length) {
        return baselineBalances[idx];
      }
      return 0;
    });

    chartData = [
      {
        x: loanPeriodLabels,
        y: paddedBaselineBalances,
        name: "Baseline Balance<br>(No Extra Payments)",
        type: "scatter",
        mode: "lines",
        line: { color: "#4f5d75", width: 2.5, dash: "dot" }, // Slate blue dashed
        text: paddedBaselineBalances.map(v => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        hovertemplate: "Loan Period %{x}<br><b>Baseline Balance:</b> %{text}<extra></extra>"
      },
      {
        x: loanPeriodLabels,
        y: paddedScenarioBalances,
        name: "Scenario Balance<br>(With Extra Principal Payments)",
        type: "scatter",
        mode: "lines",
        fill: "tonexty",
        fillcolor: "rgba(57, 87, 86, 0.08)", // Translucent Teal representation
        line: { color: "#395756", width: 3 }, // Accent Teal
        text: paddedScenarioBalances.map(v => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        hovertemplate: "Loan Period %{x}<br><b>Scenario Balance:</b> %{text}<extra></extra>"
      }
    ];

    const standardPaidSeries = monthsArray.map((_, idx) => {
      const row = simulationResult.baseline.rows[idx];
      return row ? row.payment : 0;
    });

    const acceleratedPaidSeries = monthsArray.map((_, idx) => {
      const scRow = simulationResult.scenario.rows[idx];
      return scRow ? scRow.payment : 0;
    });

    paidChartData = [
      {
        x: loanPeriodLabels,
        y: acceleratedPaidSeries,
        name: "Scenario Monthly Payment<br>(With Extra Principal Payments)",
        type: "scatter",
        mode: "lines",
        line: { color: "#395756", width: 3 },
        text: acceleratedPaidSeries.map((v) => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        hovertemplate: "Loan Period %{x}<br><b>Accelerated Payment:</b> %{text}<extra></extra>"
      },
      {
        x: loanPeriodLabels,
        y: standardPaidSeries,
        name: "Baseline Monthly Payment<br>(No Extra Payments)",
        type: "scatter",
        mode: "lines",
        line: { color: "#4f5d75", width: 2.5, dash: "dot" },
        text: standardPaidSeries.map((v) => "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
        hovertemplate: "Loan Period %{x}<br><b>Standard Payment:</b> %{text}<extra></extra>"
      }
    ];

    paidChartLayout = {
      title: {
        text: "Monthly Payment Comparison",
        font: { family: "Space Grotesk, sans-serif", size: 14, color: "#1b3022" }
      },
      hovermode: "x unified",
      xaxis: {
        title: "Loan Period",
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
          text: "Monthly Paid Amount ($)",
          standoff: 22,
        },
        gridcolor: "#f1f5f9",
        tickformat: "$,.2f",
        tickfont: { color: "#4f5d75", size: 10 }
      },
      legend: { x: 1.02, y: 1, orientation: "v", xanchor: "left", yanchor: "top" },
      height: 320,
      margin: { l: 80, r: 90, t: 30, b: 40 }
    };

    chartLayout = {
      title: {
        text: "Remaining Loan Balance Comparison",
        font: { family: "Space Grotesk, sans-serif", size: 14, color: "#1b3022" }
      },
      hovermode: "x unified",
      hoverdistance: 100,
      spikedistance: -1,
      xaxis: {
        title: "Loan Period",
        tickmode: "array",
        tickvals: xTickVals,
        ticktext: xTickText,
        tickangle: 0,
        automargin: true,
        gridcolor: "#f1f5f9",
        tickfont: { color: "#4f5d75", size: 10 },
        showspikes: true,
        spikemode: "across",
        spikesnap: "cursor",
        spikethickness: 1,
        spikecolor: "#4f5d75"
      },
      yaxis: {
        title: {
          text: "Remaining Principal ($)",
          standoff: 22,
        },
        gridcolor: "#f1f5f9",
        tickformat: "$,.0f",
        tickfont: { color: "#4f5d75", size: 10 }
      },
      legend: { x: 1.02, y: 1, orientation: "v", xanchor: "left", yanchor: "top" },
      height: 330,
      margin: { l: 60, r: 90, t: 30, b: 40 }
    };
  }

  outputsRef.current = {
    charts: {
      remainingBalanceComparison: {
        intent: "Compares baseline remaining balance against accelerated-payment remaining balance over loan periods.",
        data: chartData,
        layout: chartLayout,
      },
      monthlyPaymentComparison: {
        intent: "Compares monthly payments in baseline vs accelerated scenarios across the loan timeline.",
        data: paidChartData,
        layout: paidChartLayout,
      },
    },
    summary: simulationResult
      ? {
          interestSaved: Number(simulationResult.interestSaved || 0),
          monthsSaved: Number(simulationResult.monthsSaved || 0),
          baselineDurationMonths: Number(simulationResult?.baseline?.durationMonths || 0),
          scenarioDurationMonths: Number(simulationResult?.scenario?.durationMonths || 0),
        }
      : {},
  };

  const activeLoan = selectedLoan;

  const handleExportCSV = () => {
    if (!simulationResult || !activeLoan) return;

    void fetch("/api/usage/export-activity", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ source: "paymentScenarios" }),
    }).catch(() => {
      // Best-effort tracking only; do not block export behavior.
    });

    const headers = [
      "Period",
      "Interest Rate (%)",
      "Extra Principal Payment Applied",
      "Standard Balance",
      "Accelerated Balance",
      "Standard Loan to Value %",
      "Accelerated Loan to Value %",
      "Standard Payment",
      "Accelerated Payment"
    ].join(",") + "\n";

    const rows = simulationResult.baseline.rows.map((row: any, idx: number) => {
      const scRow = simulationResult.scenario.rows[idx] || {
        remainingBalance: 0,
        payment: 0,
        extraPaymentPaid: 0,
        currentRate: row.currentRate
      };
      const extraPaidThisMonth = scRow.extraPaymentPaid || 0;
      const activeRate = scRow.currentRate ?? row.currentRate ?? 0;
      const standardLtv = activeLoan.assetCost > 0 ? (row.remainingBalance / activeLoan.assetCost) * 100 : 0;
      const acceleratedLtv = activeLoan.assetCost > 0 ? (scRow.remainingBalance / activeLoan.assetCost) * 100 : 0;

      return [
        row.month,
        activeRate.toFixed(2),
        extraPaidThisMonth.toFixed(2),
        row.remainingBalance.toFixed(2),
        scRow.remainingBalance.toFixed(2),
        standardLtv.toFixed(2),
        acceleratedLtv.toFixed(2),
        row.payment.toFixed(2),
        scRow.payment.toFixed(2)
      ].join(",");
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `payment_scenarios_${activeLoan.name.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1b3022] font-display flex items-center gap-2">
            <Coins className="w-8 h-8 text-[#1b3022]" /> Payment Scenarios
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Simulate extra principal payments and assess compound interest savings and payoff period reductions.
          </p>
        </div>
      </div>

      {/* Main interactive area with conditional overlay */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Config Panel: Span 4 */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Select Saved Loan Box */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
              Step 1: Choose a Saved Loan
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Select a loan:</label>
              {isLoadingLoans ? (
                <p className="text-xs text-slate-600">Loading stored loans...</p>
              ) : loans.length === 0 ? (
                <div className="text-xs text-amber-800 bg-amber-50 rounded-lg p-3 border border-amber-200">
                  No custom loans found. Save a loan on the Amortization Calculator page first!
                </div>
              ) : (
                <select
                  className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-250 rounded-lg focus:outline-hidden font-sans font-medium text-slate-700"
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                >
                  {loans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} (${(l.assetCost - l.downPayment).toLocaleString()} | {l.years}y {l.rateType})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Setup Extra Payments Form */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
              Step 2: Add Extra Principal Payments
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Payment Strategy</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setNewType("single")}
                    className={`py-1 text-xs font-semibold rounded ${
                      newType === "single" ? "bg-white text-brand-green shadow-xs" : "text-slate-500"
                    }`}
                  >
                    One-time
                  </button>
                  <button
                    onClick={() => setNewType("recurring")}
                    className={`py-1 text-xs font-semibold rounded ${
                      newType === "recurring" ? "bg-white text-brand-green shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Recurring
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Extra Payment Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-600 font-mono text-xs">$</span>
                  <input
                    type="number"
                    className="w-full text-xs pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Math.max(1, Number(e.target.value)))}
                  />
                </div>
              </div>

              {newType === "single" ? (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Target Month</label>
                  <input
                    type="number"
                    min={1}
                    max={maxPeriod}
                    className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(Math.max(1, Math.min(maxPeriod, Number(e.target.value) || 1)))}
                  />
                  <span className="text-[9px] text-slate-600 mt-0.5 block leading-normal">
                    e.g. Month 12 is end of year 1, month 24 is end of year 2, etc.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Start Month</label>
                    <input
                      type="number"
                      min={1}
                      max={maxPeriod}
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                      value={newStartPeriod}
                      onChange={(e) => setNewStartPeriod(Math.max(1, Math.min(maxPeriod, Number(e.target.value) || 1)))}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">End Month</label>
                    <input
                      type="number"
                      min={1}
                      max={maxPeriod}
                      className="w-full text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-mono"
                      value={Number.isFinite(newEndPeriod) ? newEndPeriod : ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setNewEndPeriod(Number.NaN);
                          return;
                        }
                        setNewEndPeriod(Math.max(1, Math.min(maxPeriod, Number(raw) || 1)));
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleAddExtraPayment}
                className="w-full py-2 bg-[#1b3022] hover:bg-[#395756] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Extra Payment
              </button>
            </div>
          </div>

          {/* List of Scheduled Extra Payments */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
              Active Extra Payments Schedule
            </h4>

            {extraPayments.length === 0 ? (
              <p className="text-xs text-slate-600 italic">No extra payments added to simulation. Monthly amortization remains standard.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {extraPayments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-2.5 bg-[#1b3022]/5 rounded-lg border border-[#1b3022]/10">
                    <div className="text-xs font-sans">
                      <div className="font-bold text-slate-900">${p.amount.toLocaleString()} Extra</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {p.type === "single" 
                          ? `At Month ${p.period}` 
                          : `Months ${p.startPeriod} to ${p.endPeriod} periodic`
                        }
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveExtraPayment(p.id)}
                      className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => handleSimulate()}
              className="w-full mt-3 py-2 bg-[#395756] text-white font-bold text-xs uppercase tracking-wide rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#4f5d75] transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> Recalculate Scenario Balances
            </button>
          </div>

          {/* Save / Load Payment Schedules */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b border-slate-100 pb-2">
              Step 3: Save / Load Payment Schedules
            </h4>

            {!isPremium ? (
              <div className="text-xs text-amber-800 bg-amber-50 rounded-lg p-3 border border-amber-200">
                Premium access is required to save and load payment schedules.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Schedule Name</label>
                  <input
                    type="text"
                    className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden font-sans"
                    placeholder="e.g. Every Month"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                  />
                  <button
                    onClick={handleSavePaymentSchedule}
                    disabled={isSavingSchedule || !selectedLoanId}
                    className="w-full py-2 bg-[#1b3022] hover:bg-[#395756] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> {isSavingSchedule ? "Saving..." : "Save Payment Schedule"}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase">Load Saved Schedule</label>
                  {isLoadingSchedules ? (
                    <p className="text-xs text-slate-600">Loading saved schedules...</p>
                  ) : savedSchedules.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No saved payment schedules for this loan yet.</p>
                  ) : (
                    <select
                      className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-250 rounded-lg focus:outline-hidden font-sans font-medium text-slate-700"
                      value={selectedScheduleId}
                      onChange={(e) => setSelectedScheduleId(e.target.value)}
                    >
                      {savedSchedules.map((schedule) => (
                        <option key={schedule.id} value={schedule.id}>
                          {schedule.name} ({schedule.extraPayments.length} extra payment{schedule.extraPayments.length === 1 ? "" : "s"})
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    onClick={handleLoadPaymentSchedule}
                    disabled={savedSchedules.length === 0 || !selectedScheduleId}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Load Payment Schedule
                  </button>
                </div>

                {scheduleStatus && (
                  <div
                    className={`text-xs rounded-lg px-3 py-2 border ${
                      scheduleStatus.success
                        ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}
                  >
                    {scheduleStatus.message}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Content Column: Graphs and Table comparisons (Span 8) */}
        <div className="lg:col-span-8 space-y-6">

          {/* Savings Callouts and Impact summaries */}
          {simulationResult && (
            <div className="grid sm:grid-cols-2 gap-4">
              
              {/* Box A: Interest Savings */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 border-l-4 border-l-[#1b3022]">
                <div className="w-12 h-12 rounded-xl bg-[#1b3022]/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-brand-green" />
                </div>
                <div>
                  <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Interest Saved</div>
                  <div className="text-2xl font-bold font-display text-brand-green mt-0.5">
                    ${simulationResult.interestSaved.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">Total lifetime finance cost saved!</p>
                </div>
              </div>

              {/* Box B: Payoff Acceleration */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center gap-4 border-l-4 border-l-[#7261a3]">
                <div className="w-12 h-12 rounded-xl bg-[#7261a3]/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 text-[#7261a3]" />
                </div>
                <div>
                  <div className="text-slate-600 text-[10px] uppercase font-bold tracking-wider">Payoff Acceleration</div>
                  <div className="text-2xl font-bold font-display text-[#7261a3] mt-0.5">
                    {simulationResult.monthsSaved} Months Sooner
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Repaid in {simulationResult.scenario.durationMonths} months instead of {simulationResult.baseline.durationMonths}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note about variable rate ARMS */}
          <p className="mb-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" /> Variable rate loans are not paid off sooner, because the monthly payment is re-calculated at each rate adjustment to pay off the loan over the original term.
          </p>

          <p className="mb-4 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <span>
              Monthly payment amounts do not include escrow or fees like taxes, insurance, private mortgage insurance (PMI), or home owners association (HOA) fees.
            </span>
          </p>

          {/* Interactive Plotly Balances Comparison Graph */}
          {simulationResult && (
            <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xs">
              <PlotlyChart id="remaining-balance-plotly" data={chartData} layout={chartLayout} />
            </div>
          )}

          {/* Monthly Paid Comparison Chart */}
          {simulationResult && (
            <div className="bg-white border border-slate-200 p-4 sm:p-6 rounded-2xl shadow-xs">
              <PlotlyChart id="paid-comparison-plotly" data={paidChartData} layout={paidChartLayout} />
            </div>
          )}

          {/* Comparative Ledger Table */}
          {simulationResult && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-150 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-bold text-slate-800 font-display">Side-by-Side Payment Comparison</h4>
                  <p className="text-xs text-slate-500">Track loan balance with standard payments vs accelerated payments, and see the impact of extra payments.</p>
                </div>
                <button
                  id="export-payment-scenarios"
                  onClick={handleExportCSV}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent-teal hover:bg-accent-slate text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download as CSV (Excel) File
                </button>
              </div>

              <div className="overflow-x-auto max-h-[340px]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-mono border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Period</th>
                      <th className="py-2.5 px-4">Year-Month</th>
                      <th className="py-2.5 px-4 text-center">Interest Rate (%)</th>
                      <th className="py-2.5 px-4 text-center">Extra Principal Payment Applied</th>
                      <th className="py-2.5 px-4">Standard Balance</th>
                      <th className="py-2.5 px-4">Accelerated Balance</th>
                      <th className="py-2.5 px-4">Standard Loan to Value (%)</th>
                      <th className="py-2.5 px-4">Accelerated Loan to Value (%)</th>
                      <th className="py-2.5 px-4">Standard Payment</th>
                      <th className="py-2.5 px-4">Accelerated Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-slate-600">
                    {simulationResult.baseline.rows.map((row: any, idx: number) => {
                      const scRow = simulationResult.scenario.rows[idx] || { remainingBalance: 0, payment: 0, extraPaymentPaid: 0, currentRate: row.currentRate };
                      const extraPaidThisMonth = scRow.extraPaymentPaid || 0;
                      const activeRate = scRow.currentRate ?? row.currentRate ?? 6.5;
                      const standardLtv = activeLoan && activeLoan.assetCost > 0 ? (row.remainingBalance / activeLoan.assetCost) * 100 : 0;
                      const acceleratedLtv = activeLoan && activeLoan.assetCost > 0 ? (scRow.remainingBalance / activeLoan.assetCost) * 100 : 0;
                      
                      return (
                        <tr 
                          key={row.month} 
                          className={`hover:bg-slate-50/70 ${extraPaidThisMonth > 0 ? "bg-[#1b3022]/5" : ""}`}
                        >
                          <td className="py-2 px-4 font-bold text-slate-850">Month {row.month}</td>
                          <td className="py-2 px-4 text-slate-700">Year {Math.floor((row.month - 1) / 12) + 1}, Month {((row.month - 1) % 12) + 1}</td>
                          <td className="py-2 px-4 text-center font-semibold text-slate-700">
                            {activeRate.toFixed(2)}%
                          </td>
                          <td className="py-2 px-4 text-center font-bold text-brand-green">
                            {extraPaidThisMonth > 0 ? `$${extraPaidThisMonth.toLocaleString()}` : "-"}
                          </td>
                          <td className="py-2 px-4">${row.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 px-4 font-bold text-slate-900">
                            {scRow.remainingBalance > 0 || idx < simulationResult.scenario.rows.length
                              ? `$${scRow.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                              : "$0.00 (PAID)"
                            }
                          </td>
                          <td className="py-2 px-4">{standardLtv.toFixed(2)}%</td>
                          <td className="py-2 px-4">{acceleratedLtv.toFixed(2)}%</td>
                          <td className="py-2 px-4 text-slate-500">${row.payment.toLocaleString()}</td>
                          <td className="py-2 px-4 font-bold text-slate-800">${scRow.payment.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
