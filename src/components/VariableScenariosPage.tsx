import { useState, useEffect, useRef } from "react";
import { 
  GitCommit,
  TrendingDown,
  Percent,
  House,
  DollarSign,
  HelpCircle,
  TrendingUp,
  Info,
  Layers,
  Sliders,
  Calendar,
  Zap,
  ShieldAlert,
  Hourglass,
  RefreshCw,
  Gauge,
  ArrowRight
} from "lucide-react";
import PlotlyChart from "./PlotlyChart";

type ScenarioMode = "hold-payment" | "hold-cost" | "hold-principal" | "hold-rate";

const TERM_OPTIONS = [3, 5, 6, 7, 10, 15, 20, 30, 40];

interface AgentSetInputEventDetail {
  page?: string;
  state?: Record<string, unknown>;
}

// Deterministic simulation of ARM payments over time for single timeline trend
function generateVariableRateAmortization(
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

  for (let month = 1; month <= totalMonths; month++) {
    if (remainingBalance <= 0) break;

    // ARM rate adjustment trigger
    if (month > fixedYears * 12) {
      const elapsedSinceFixed = month - 1 - (fixedYears * 12);
      if (elapsedSinceFixed % periodicityMonths === 0) {
        if (trendScenario === "average") {
          const changeMagnitude = (Math.sin(month / 12) * volatility * 1.5) + (0.1 * volatility);
          let potentialNewRate = currentRate + changeMagnitude;
          potentialNewRate = Math.max(1.0, Math.min(startRate + maxIncrease, potentialNewRate));
          currentRate = potentialNewRate;
        } else if (trendScenario === "worst") {
          let potentialNewRate = currentRate + volatility;
          potentialNewRate = Math.max(1.0, Math.min(startRate + maxIncrease, potentialNewRate));
          currentRate = potentialNewRate;
        } else if (trendScenario === "best") {
          let potentialNewRate = currentRate - volatility;
          potentialNewRate = Math.max(1.0, Math.min(startRate + maxIncrease, potentialNewRate));
          currentRate = potentialNewRate;
        }
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

// Monte-Carlo simulator runs count trials of random walk variable rates
function runMonteCarloSimulations(
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
  const results = [];

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
          // Randomized walk step with a very slight upward bias to simulate market pressure
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

export default function VariableScenariosPage() {
  const [activeTab, setActiveTab] = useState<"fixed" | "variable">("fixed");

  // Fixed Rate Inputs (Existing Content)
  const [scenario, setScenario] = useState<ScenarioMode>("hold-payment");
  const [targetPayment, setTargetPayment] = useState(1800);
  const [holdDurationYears, setHoldDurationYears] = useState(30);
  const [targetCost, setTargetCost] = useState(500000);
  const [holdInterestRate, setHoldInterestRate] = useState(8.25);
  const [holdCostDurationYears, setHoldCostDurationYears] = useState(30);
  const [holdPrincipal, setHoldPrincipal] = useState(300000);
  const [holdPrincipalDurationYears, setHoldPrincipalDurationYears] = useState(30);
  const [holdRateInterestRate, setHoldRateInterestRate] = useState(6.5);
  const [holdRateDurationYears, setHoldRateDurationYears] = useState(30);

  // Variable Tab state variables (ARM parameters)
  const [varPrincipal, setVarPrincipal] = useState(350000); // Fixed Principal for Variable Sim
  const [varStartRate, setVarStartRate] = useState(5.75); // Starting entry rate
  const [varFixedYears, setVarFixedYears] = useState(5); // Initial Fixed rate period (years)
  const [varPeriodicity, setVarPeriodicity] = useState(12); // Adjustment periodicity (months)
  const [varMaxIncrease, setVarMaxIncrease] = useState(5.0); // Interest rate cap limit (% increase)
  const [varVolatility, setVarVolatility] = useState(0.5); // adjustment magnitude %
  const [varTermYears, setVarTermYears] = useState(30); // years (e.g. 30 year ARM)

  // Sub tabs for Variable tab
  const [varSubTab, setVarSubTab] = useState<"timeline" | "montecarlo">("timeline");
  const [varTrendScenario, setVarTrendScenario] = useState<"best" | "average" | "worst">("average");
  const [mcResults, setMcResults] = useState<number[]>([]);
  const [mcTrigger, setMcTrigger] = useState(0);

  // 2D Fixed Rate Graph Data state
  const [fixedPlotData, setFixedPlotData] = useState<any[]>([]);
  const [fixedPlotLayout, setFixedPlotLayout] = useState<Record<string, any>>({});
  const outputsRef = useRef<Record<string, unknown>>({
    charts: {},
    summary: {},
  });

  // Listen for external input updates via the "set_input" event and
  // update the local component state accordingly. This allows the
  // variable scenarios page to respond to partial state updates coming
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
      if (!detail || detail.page !== "scenarios" || !detail.state || typeof detail.state !== "object") {
        return;
      }

      const state = detail.state;

      if (typeof state.activeTab === "string" && ["fixed", "variable"].includes(state.activeTab)) {
        setActiveTab(state.activeTab as "fixed" | "variable");
      }
      if (typeof state.scenario === "string" && ["hold-payment", "hold-cost", "hold-principal", "hold-rate"].includes(state.scenario)) {
        setScenario(state.scenario as ScenarioMode);
      }

      const targetPaymentValue = toNumber(state.targetPayment);
      if (targetPaymentValue !== null) setTargetPayment(Math.max(10, targetPaymentValue));

      const holdDurationYearsValue = toNumber(state.holdDurationYears);
      if (holdDurationYearsValue !== null && TERM_OPTIONS.includes(Math.trunc(holdDurationYearsValue))) {
        setHoldDurationYears(Math.trunc(holdDurationYearsValue));
      }

      const targetCostValue = toNumber(state.targetCost);
      if (targetCostValue !== null) setTargetCost(Math.max(100, targetCostValue));

      const holdInterestRateValue = toNumber(state.holdInterestRate);
      if (holdInterestRateValue !== null) setHoldInterestRate(Math.max(0, holdInterestRateValue));

      const holdCostDurationYearsValue = toNumber(state.holdCostDurationYears);
      if (holdCostDurationYearsValue !== null && TERM_OPTIONS.includes(Math.trunc(holdCostDurationYearsValue))) {
        setHoldCostDurationYears(Math.trunc(holdCostDurationYearsValue));
      }

      const holdPrincipalValue = toNumber(state.holdPrincipal);
      if (holdPrincipalValue !== null) setHoldPrincipal(Math.max(100, holdPrincipalValue));

      const holdPrincipalDurationYearsValue = toNumber(state.holdPrincipalDurationYears);
      if (holdPrincipalDurationYearsValue !== null && TERM_OPTIONS.includes(Math.trunc(holdPrincipalDurationYearsValue))) {
        setHoldPrincipalDurationYears(Math.trunc(holdPrincipalDurationYearsValue));
      }

      const holdRateInterestRateValue = toNumber(state.holdRateInterestRate);
      if (holdRateInterestRateValue !== null) setHoldRateInterestRate(Math.max(0, holdRateInterestRateValue));

      const holdRateDurationYearsValue = toNumber(state.holdRateDurationYears);
      if (holdRateDurationYearsValue !== null && TERM_OPTIONS.includes(Math.trunc(holdRateDurationYearsValue))) {
        setHoldRateDurationYears(Math.trunc(holdRateDurationYearsValue));
      }

      const varPrincipalValue = toNumber(state.varPrincipal);
      if (varPrincipalValue !== null) setVarPrincipal(Math.max(1000, varPrincipalValue));

      const varStartRateValue = toNumber(state.varStartRate);
      if (varStartRateValue !== null) setVarStartRate(Math.max(0.1, varStartRateValue));

      const varFixedYearsValue = toNumber(state.varFixedYears);
      if (varFixedYearsValue !== null && [3, 5, 7, 10].includes(Math.trunc(varFixedYearsValue))) {
        setVarFixedYears(Math.trunc(varFixedYearsValue));
      }

      const varPeriodicityValue = toNumber(state.varPeriodicity);
      if (varPeriodicityValue !== null && [6, 12, 24].includes(Math.trunc(varPeriodicityValue))) {
        setVarPeriodicity(Math.trunc(varPeriodicityValue));
      }

      const varMaxIncreaseValue = toNumber(state.varMaxIncrease);
      if (varMaxIncreaseValue !== null) setVarMaxIncrease(Math.max(0, varMaxIncreaseValue));

      const varVolatilityValue = toNumber(state.varVolatility);
      if (varVolatilityValue !== null) setVarVolatility(Math.max(0, varVolatilityValue));

      const varTermYearsValue = toNumber(state.varTermYears);
      if (varTermYearsValue !== null && [15, 20, 30, 40].includes(Math.trunc(varTermYearsValue))) {
        setVarTermYears(Math.trunc(varTermYearsValue));
      }

      if (typeof state.varSubTab === "string" && ["timeline", "montecarlo"].includes(state.varSubTab)) {
        setVarSubTab(state.varSubTab as "timeline" | "montecarlo");
      }

      if (typeof state.varTrendScenario === "string" && ["best", "average", "worst"].includes(state.varTrendScenario)) {
        setVarTrendScenario(state.varTrendScenario as "best" | "average" | "worst");
      }
    };

    window.addEventListener("agent:set_input", handleSetInputEvent as EventListener);
    return () => {
      window.removeEventListener("agent:set_input", handleSetInputEvent as EventListener);
    };
  }, []);

  // Handle agent:collect_state events to provide the current variable scenarios page state.
  useEffect(() => {
    const handleCollectState = (event: Event) => {
      const detail = (event as CustomEvent<{ page?: string }>).detail;
      if (!detail || detail.page !== "scenarios") {
        return;
      }

      window.dispatchEvent(new CustomEvent("agent:state_collected", {
        detail: {
          page: "scenarios",
          state: {
            activeTab,
            scenario,
            targetPayment,
            holdDurationYears,
            targetCost,
            holdInterestRate,
            holdCostDurationYears,
            holdPrincipal,
            holdPrincipalDurationYears,
            holdRateInterestRate,
            holdRateDurationYears,
            varPrincipal,
            varStartRate,
            varFixedYears,
            varPeriodicity,
            varMaxIncrease,
            varVolatility,
            varTermYears,
            varSubTab,
            varTrendScenario,
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
    activeTab,
    scenario,
    targetPayment,
    holdDurationYears,
    targetCost,
    holdInterestRate,
    holdCostDurationYears,
    holdPrincipal,
    holdPrincipalDurationYears,
    holdRateInterestRate,
    holdRateDurationYears,
    varPrincipal,
    varStartRate,
    varFixedYears,
    varPeriodicity,
    varMaxIncrease,
    varVolatility,
    varTermYears,
    varSubTab,
    varTrendScenario,
  ]);

  // Compute 2D Fixed Data whenever inputs modify
  useEffect(() => {
    if (scenario === "hold-payment") {
      const rates: number[] = [];
      const principals: number[] = [];
      const n = holdDurationYears * 12;

      for (let rAnnual = 1.0; rAnnual <= 15.0; rAnnual += 0.25) {
        rates.push(rAnnual);
        const rMonthly = (rAnnual / 100) / 12;
        let maxPrincipal = 0;
        if (rMonthly === 0) {
          maxPrincipal = targetPayment * n;
        } else {
          maxPrincipal = targetPayment * (1 - Math.pow(1 + rMonthly, -n)) / rMonthly;
        }
        principals.push(maxPrincipal);
      }

      setFixedPlotData([
        {
          x: rates,
          y: principals,
          type: "scatter",
          mode: "lines+markers",
          name: "Borrowable Capital",
          line: { color: "#7261a3", width: 3 },
          marker: { color: "#A67DB8", size: 5 },
          text: rates.map((r, i) => {
            const p = principals[i];
            const formattedPct = r.toFixed(2) + "%";
            const formattedAmount = "$" + p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `Rate: ${formattedPct}<br>Maximum Borrowable: ${formattedAmount}`;
          }),
          hovertemplate: "%{text}<extra></extra>"
        }
      ]);

      setFixedPlotLayout({
        title: {
          text: `Borrowing Capacity vs. Annual Interest Rate<br>at $${targetPayment.toLocaleString()}/mo (${holdDurationYears} yr term)`,
          font: { family: "Space Grotesk, sans-serif", size: 13, color: "#1b3022" }
        },
        xaxis: {
          title: "Annual Interest Rate (%)",
          gridcolor: "#f1f5f9",
          dtick: 1.0,
          ticksuffix: "%",
          tickfont: { color: "#4f5d75" }
        },
        yaxis: {
          title: "Maximum Borrowable Principal ($)",
          gridcolor: "#f1f5f9",
          tickformat: "$,.0f",
          tickfont: { color: "#4f5d75" }
        },
        hovermode: "closest",
        margin: { l: 70, r: 20, t: 40, b: 50 },
        height: 380
      });

    } else if (scenario === "hold-cost") {
      const downPayments: number[] = [];
      const calculatedPayments: number[] = [];
      const n = holdCostDurationYears * 12;
      const rMonthly = (holdInterestRate / 100) / 12;
      const safeTargetCost = Math.max(targetCost, 1);

      const step = safeTargetCost / 25;
      for (let dp = 0; dp <= safeTargetCost * 0.9; dp += step) {
        downPayments.push(dp);
        const principal = safeTargetCost - dp;
        let pmt = 0;
        if (rMonthly === 0) {
          pmt = principal / n;
        } else {
          pmt = principal * (rMonthly * Math.pow(1 + rMonthly, n)) / (Math.pow(1 + rMonthly, n) - 1);
        }
        calculatedPayments.push(pmt);
      }

      setFixedPlotData([
        {
          x: downPayments,
          y: calculatedPayments,
          type: "scatter",
          mode: "lines+markers",
          name: "Required Payment",
          line: { color: "#1b3022", width: 3 },
          marker: { color: "#395756", size: 5 },
          text: downPayments.map((dp, i) => {
            const pmt = calculatedPayments[i];
            const formattedDp = "$" + dp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const formattedPmt = "$" + pmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `Down Payment: ${formattedDp}<br>Monthly Payment: ${formattedPmt}`;
          }),
          hovertemplate: "%{text}<extra></extra>"
        }
      ]);

      setFixedPlotLayout({
        title: {
          text: `Monthly Payment vs. Down Payment<br>for $${targetCost.toLocaleString()} Asset (${holdCostDurationYears} yr term, ${holdInterestRate}% rate)`,
          font: { family: "Space Grotesk, sans-serif", size: 12, color: "#1b3022" }
        },
        xaxis: {
          title: "Down Payment Amount ($)",
          gridcolor: "#f1f5f9",
          tickformat: "$,.0f",
          tickfont: { color: "#4f5d75" }
        },
        yaxis: {
          title: "Required Monthly Payment ($)",
          gridcolor: "#f1f5f9",
          tickformat: "$,.0f",
          tickfont: { color: "#4f5d75" }
        },
        hovermode: "closest",
        margin: { l: 70, r: 20, t: 40, b: 50 },
        height: 380
      });

    } else if (scenario === "hold-principal") {
      const rates: number[] = [];
      const monthlyPayments: number[] = [];
      const n = holdPrincipalDurationYears * 12;

      for (let rAnnual = 1.0; rAnnual <= 15.0; rAnnual += 0.25) {
        rates.push(rAnnual);
        const rMonthly = (rAnnual / 100) / 12;
        let pmt = 0;
        if (rMonthly === 0) {
          pmt = holdPrincipal / n;
        } else {
          pmt = holdPrincipal * (rMonthly * Math.pow(1 + rMonthly, n)) / (Math.pow(1 + rMonthly, n) - 1);
        }
        monthlyPayments.push(pmt);
      }

      setFixedPlotData([
        {
          x: rates,
          y: monthlyPayments,
          type: "scatter",
          mode: "lines+markers",
          name: `Required Monthly Payment`,
          line: { color: "#395756", width: 3 },
          marker: { color: "#7261a3", size: 5 },
          text: rates.map((r, i) => {
            const pmt = monthlyPayments[i];
            const formattedPct = r.toFixed(2) + "%";
            const formattedPmt = "$" + pmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `Annual Interest Rate: ${formattedPct}<br>Monthly Payment: ${formattedPmt}`;
          }),
          hovertemplate: "%{text}<extra></extra>"
        }
      ]);

      setFixedPlotLayout({
        title: {
          text: `Monthly Payment vs. Annual Interest Rate<br>for $${holdPrincipal.toLocaleString()} Loan (${holdPrincipalDurationYears} years)`,
          font: { family: "Space Grotesk, sans-serif", size: 12, color: "#1b3022" }
        },
        xaxis: {
          title: "Annual Interest Rate (%)",
          gridcolor: "#f1f5f9",
          dtick: 1.0,
          ticksuffix: "%",
          tickfont: { color: "#4f5d75" }
        },
        yaxis: {
          title: "Required Monthly Payment ($)",
          gridcolor: "#f1f5f9",
          tickformat: "$,.0f",
          tickfont: { color: "#4f5d75" }
        },
        hovermode: "closest",
        margin: { l: 70, r: 20, t: 40, b: 50 },
        height: 380
      });
    } else if (scenario === "hold-rate") {
      const principals: number[] = [];
      const monthlyPayments: number[] = [];
      const n = holdRateDurationYears * 12;
      const rMonthly = (holdRateInterestRate / 100) / 12;

      for (let principal = 50000; principal <= 2000000; principal += 25000) {
        principals.push(principal);
        let pmt = 0;
        if (rMonthly === 0) {
          pmt = principal / n;
        } else {
          pmt = principal * (rMonthly * Math.pow(1 + rMonthly, n)) / (Math.pow(1 + rMonthly, n) - 1);
        }
        monthlyPayments.push(pmt);
      }

      setFixedPlotData([
        {
          x: principals,
          y: monthlyPayments,
          type: "scatter",
          mode: "lines+markers",
          name: "Required Monthly Payment",
          line: { color: "#7261a3", width: 3 },
          marker: { color: "#395756", size: 5 },
          text: principals.map((p, i) => {
            const pmt = monthlyPayments[i];
            const formattedPrincipal = "$" + p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const formattedPmt = "$" + pmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `Principal: ${formattedPrincipal}<br>Monthly Payment: ${formattedPmt}`;
          }),
          hovertemplate: "%{text}<extra></extra>"
        }
      ]);

      setFixedPlotLayout({
        title: {
          text: `Monthly Payment vs. Principal<br>at ${holdRateInterestRate}% (${holdRateDurationYears} years)` ,
          font: { family: "Space Grotesk, sans-serif", size: 12, color: "#1b3022" }
        },
        xaxis: {
          title: "Principal Amount ($)",
          gridcolor: "#f1f5f9",
          tickformat: "$,.0f",
          tickfont: { color: "#4f5d75" }
        },
        yaxis: {
          title: "Required Monthly Payment ($)",
          gridcolor: "#f1f5f9",
          tickformat: "$,.0f",
          tickfont: { color: "#4f5d75" }
        },
        hovermode: "closest",
        margin: { l: 70, r: 20, t: 40, b: 50 },
        height: 380
      });
    }
  }, [
    scenario,
    targetPayment,
    holdDurationYears,
    targetCost,
    holdInterestRate,
    holdCostDurationYears,
    holdPrincipal,
    holdPrincipalDurationYears,
    holdRateInterestRate,
    holdRateDurationYears
  ]);

  // Handle Term Index snap change
  const handleTermSliderChange = (val: number, setter: (y: number) => void) => {
    const years = TERM_OPTIONS[val];
    setter(years);
  };

  // Re-run Monte-Carlo on demand or automatic
  useEffect(() => {
    if (activeTab === "variable") {
      const results = runMonteCarloSimulations(
        varPrincipal,
        varStartRate,
        varTermYears,
        varFixedYears,
        varPeriodicity,
        varMaxIncrease,
        varVolatility,
        500
      );
      setMcResults(results);
    }
  }, [varPrincipal, varStartRate, varTermYears, varFixedYears, varPeriodicity, varMaxIncrease, varVolatility, mcTrigger, activeTab]);

  // Generate 2D Timeline Plotly Data
  const timelineRows = generateVariableRateAmortization(
    varPrincipal,
    varStartRate,
    varTermYears,
    varFixedYears,
    varPeriodicity,
    varMaxIncrease,
    varVolatility,
    varTrendScenario
  );

  const timelineMonths = timelineRows.map(r => r.month);
  const timelinePeriodLabels = timelineMonths.map((month) => {
    const year = Math.floor((month - 1) / 12) + 1;
    const monthOfYear = ((month - 1) % 12) + 1;
    return `Year ${year}, Month ${monthOfYear}`;
  });
  const timelineDesiredTicks = 8;
  let timelineTickIndices: number[] = [];

  if (timelinePeriodLabels.length <= timelineDesiredTicks) {
    timelineTickIndices = Array.from({ length: timelinePeriodLabels.length }, (_, idx) => idx);
  } else {
    const maxIdx = timelinePeriodLabels.length - 1;
    timelineTickIndices = Array.from({ length: timelineDesiredTicks }, (_, idx) =>
      Math.round((idx * maxIdx) / (timelineDesiredTicks - 1))
    );
    timelineTickIndices = Array.from(new Set(timelineTickIndices));
  }

  const timelineTickVals = timelineTickIndices.map((idx) => timelinePeriodLabels[idx]);
  const timelineTickText = timelineTickVals.map((label) => label.replace(", ", ",<br>"));
  const timelinePayments = timelineRows.map(r => r.payment);
  const timelineRates = timelineRows.map(r => r.rate);

  // Find Peak and Average Payments for Key Information callout
  const peakPaymentVal = Math.max(...timelinePayments, 0);
  const avgPaymentVal = timelinePayments.reduce((s, x) => s + x, 0) / (timelinePayments.length || 1);
  const endBalanceVal = timelineRows.length > 0 ? timelineRows[timelineRows.length - 1].remainingBalance : 0;
  const totalInterestPaidVal = timelineRows.reduce((sum, row) => sum + row.interestPaid, 0);

  const timelineChartData = [
    {
      x: timelinePeriodLabels,
      y: timelinePayments,
      type: "scatter",
      mode: "lines+markers",
      name: "Monthly Payment",
      line: { color: "#395756", width: 2.5 },
      marker: {
        size: 5,
        color: timelineRates,
        colorscale: "Viridis",
        showscale: true,
        colorbar: {
          title: "Period Rate",
          titleside: "right",
          tickfont: { family: "JetBrains Mono", size: 8 }
        }
      },
      text: timelineRows.map((r, i) => {
        const loanPeriod = timelinePeriodLabels[i] || `Year ${Math.floor((r.month - 1) / 12) + 1}, Month ${((r.month - 1) % 12) + 1}`;
        return `${loanPeriod}<br>Payment: $${r.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>Rate: ${r.rate.toFixed(2)}%<br>Interest Paid: $${r.interestPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>Principal Paid: $${r.principalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>Remaining Bal: $${r.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }),
      hovertemplate: "%{text}<extra></extra>"
    }
  ];

  const timelineChartLayout = {
    title: {
      text: `Monthly Payment & Rates Over Time<br>(${varTrendScenario.toUpperCase()} Trend Scenario)`,
      font: { family: "Space Grotesk, sans-serif", size: 13, color: "#1b3022" }
    },
    xaxis: {
      title: "Loan Period",
      tickmode: "array",
      tickvals: timelineTickVals,
      ticktext: timelineTickText,
      tickangle: 0,
      automargin: true,
      gridcolor: "#f1f5f9",
      tickfont: { color: "#4f5d75", size: 10 }
    },
    yaxis: {
      title: {
        text: "Amortized Monthly Payment ($)",
        standoff: 22,
      },
      gridcolor: "#f1f5f9",
      tickformat: "$,.2f",
      tickfont: { color: "#4f5d75", size: 10 }
    },
    hovermode: "closest",
    margin: { l: 78, r: 25, t: 40, b: 50 },
    height: 380
  };

  // Generate Monte-Carlo Stats
  const hasMcResults = mcResults.length > 0;
  const mcMean = hasMcResults ? mcResults.reduce((s, x) => s + x, 0) / mcResults.length : 0;
  const mcP10 = hasMcResults ? mcResults[Math.floor(mcResults.length * 0.1)] : 0;
  const mcP50 = hasMcResults ? mcResults[Math.floor(mcResults.length * 0.5)] : 0;
  const mcP90 = hasMcResults ? mcResults[Math.floor(mcResults.length * 0.9)] : 0;
  const mcMin = hasMcResults ? mcResults[0] : 0;
  const mcMax = hasMcResults ? mcResults[mcResults.length - 1] : 0;

  const mcChartData = [
    {
      x: mcResults,
      type: "histogram",
      nbinsx: 18,
      name: "Runs Probability Density",
      marker: {
        color: "rgba(114, 97, 163, 0.7)",
        line: { color: "#7261a3", width: 1 }
      },
      hovertemplate: "Interest Cost Range: %{x}<br>Count: %{y}<extra></extra>"
    }
  ];

  const mcChartLayout = {
    title: {
      text: `Cumulative Lifetime Interest Paid Distribution<br>(500 trials)`,
      font: { family: "Space Grotesk, sans-serif", size: 13, color: "#1b3022" }
    },
    xaxis: {
      title: "Total Interest Paid Over Lifetime ($)",
      gridcolor: "#f1f5f9",
      tickformat: "$,.0f",
      tickfont: { color: "#4f5d75", size: 9 }
    },
    yaxis: {
      title: "Observed Trial Occurrences",
      gridcolor: "#f1f5f9",
      tickfont: { color: "#4f5d75", size: 9 }
    },
    shapes: hasMcResults ? [
      {
        type: "line",
        x0: mcMean,
        x1: mcMean,
        y0: 0,
        y1: 1,
        yref: "paper",
        line: { color: "#ef4444", width: 2, dash: "dash" }
      },
      {
        type: "line",
        x0: mcP10,
        x1: mcP10,
        y0: 0,
        y1: 1,
        yref: "paper",
        line: { color: "#22c55e", width: 1.5, dash: "dot" }
      },
      {
        type: "line",
        x0: mcP90,
        x1: mcP90,
        y0: 0,
        y1: 1,
        yref: "paper",
        line: { color: "#eab308", width: 1.5, dash: "dot" }
      }
    ] : [],
    annotations: hasMcResults ? [
      {
        x: mcMean,
        y: 0.95,
        yref: "paper",
        text: `Mean: $${Math.round(mcMean).toLocaleString()}`,
        showarrow: false,
        font: { size: 9, color: "#ef4444", family: "JetBrains Mono" },
        bgcolor: "rgba(255,255,255,0.9)",
        bordercolor: "#ef4444",
        borderwidth: 1,
        borderpad: 2
      },
      {
        x: mcP10,
        y: 0.75,
        yref: "paper",
        text: `10th% (Low): $${Math.round(mcP10).toLocaleString()}`,
        showarrow: false,
        font: { size: 9, color: "#22c55e", family: "JetBrains Mono" },
        bgcolor: "rgba(255,255,255,0.9)"
      },
      {
        x: mcP90,
        y: 0.55,
        yref: "paper",
        text: `90th% (High): $${Math.round(mcP90).toLocaleString()}`,
        showarrow: false,
        font: { size: 9, color: "#eab308", family: "JetBrains Mono" },
        bgcolor: "rgba(255,255,255,0.9)"
      }
    ] : [],
    margin: { l: 60, r: 25, t: 40, b: 50 },
    height: 380
  };

  outputsRef.current = {
    charts: {
      fixedTradeoff: {
        intent: "Shows fixed-rate trade-offs for the selected scenario such as affordability, payment, or principal sensitivity.",
        data: fixedPlotData,
        layout: fixedPlotLayout,
      },
      variableTimeline: {
        intent: "Shows projected monthly payments over time for the chosen variable-rate trend and ARM settings.",
        data: timelineChartData,
        layout: timelineChartLayout,
      },
      variableMonteCarlo: {
        intent: "Shows the distribution of total lifetime interest paid across stochastic variable-rate simulations.",
        data: mcChartData,
        layout: mcChartLayout,
      },
    },
    summary: {
      peakPayment: peakPaymentVal,
      averagePayment: avgPaymentVal,
      endingBalance: endBalanceVal,
      totalInterestPaid: totalInterestPaidVal,
      mcMean,
      mcP10,
      mcP50,
      mcP90,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1b3022] font-display flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#1b3022]" /> Trade-off Scenarios and Rate Projections
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Compare trade-offs on fixed-rate mortgages or run Monte-Carlo simulations for variable rate loans.
          </p>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 gap-1 sm:gap-0">
        <button
          onClick={() => setActiveTab("fixed")}
          className={`flex-1 min-w-[180px] px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "fixed"
              ? "border-[#1b3022] text-[#1b3022]"
              : "border-transparent text-slate-600 hover:text-slate-600"
          }`}
        >
          <Layers className="w-4 h-4" /> Fixed Rate Trade-offs
        </button>
        <button
          onClick={() => setActiveTab("variable")}
          className={`flex-1 min-w-[180px] px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "variable"
              ? "border-[#1b3022] text-[#1b3022]"
              : "border-transparent text-slate-600 hover:text-slate-600"
          }`}
        >
          <TrendingUp className="w-4 h-4 rotate-45" /> Variable Rate Projections
        </button>
      </div>

      {activeTab === "fixed" ? (
        <div className="space-y-8 animate-fade-in">
          {/* Scenario Selector Bento */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* Scenario Option 1 */}
            <button
              onClick={() => setScenario("hold-payment")}
              className={`flex flex-col items-start p-5 rounded-2xl border text-left transition cursor-pointer ${
                scenario === "hold-payment"
                  ? "bg-[#7261a3]/5 border-[#7261a3]/30 ring-2 ring-[#7261a3]/10"
                  : "bg-white border-slate-200 hover:bg-slate-50/80"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#1b3022]/10 flex items-center justify-center text-[#7261a3] mb-3">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 font-display text-sm">Constant Monthly Budget</span>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Specify a target monthly payment and compare borrow limits against interest rates (up to 15%), that would meet your monthly budget across various loan durations. Ideal for budget-conscious planning.
              </p>
            </button>

            {/* Scenario Option 2 */}
            <button
              onClick={() => setScenario("hold-cost")}
              className={`flex flex-col items-start p-5 rounded-2xl border text-left transition cursor-pointer ${
                scenario === "hold-cost"
                  ? "bg-[#1b3022]/4 border-[#1b3022]/30 ring-2 ring-[#1b3022]/5"
                  : "bg-white border-slate-200 hover:bg-slate-50/80"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#1b3022]/10 flex items-center justify-center text-[#7261a3] mb-3">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 font-display text-sm">Target Purchase Details</span>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Provide the asset price and annual interest rate, then compare monthly payment vs down payment. See how different down payments impact monthly costs. Useful for evaluating affordability at a known purchase price and rate.
              </p>
            </button>

            {/* Scenario Option 3 */}
            <button
              onClick={() => setScenario("hold-principal")}
              className={`flex flex-col items-start p-5 rounded-2xl border text-left transition cursor-pointer ${
                scenario === "hold-principal"
                  ? "bg-[#395756]/5 border-[#395756]/30 ring-2 ring-[#395756]/10"
                  : "bg-white border-slate-200 hover:bg-slate-50/80"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#395756]/10 flex items-center justify-center text-[#7261a3] mb-3">
                <House className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 font-display text-sm">Constant Principal Borrowed</span>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Specify a target loan principal (the amount you plan to borrow after a down payment). Compare monthly payments for different interest rates and loan durations. Useful for understanding payment variability on a specific loan size.
              </p>
            </button>

            {/* Scenario Option 4 */}
            <button
              onClick={() => setScenario("hold-rate")}
              className={`flex flex-col items-start p-5 rounded-2xl border text-left transition cursor-pointer ${
                scenario === "hold-rate"
                  ? "bg-[#7261a3]/5 border-[#7261a3]/30 ring-2 ring-[#7261a3]/10"
                  : "bg-white border-slate-200 hover:bg-slate-50/80"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#A67DB8]/12 flex items-center justify-center text-[#7261a3] mb-3">
                <Percent className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 font-display text-sm">Set Annual Interest Rate</span>
              <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                Set the annual interest rate for the loan and see how much you could borrow for different monthly budgets.
              </p>
            </button>
          </div>

          {/* Main Graph & Setup Partition */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Settings column */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-xs">
              <h3 className="font-bold text-slate-900 border-b border-slate-150 pb-2.5 text-xs uppercase tracking-wider font-mono">
                Scenario Parameters
              </h3>

              {/* Conditional inputs */}
              {scenario === "hold-payment" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Target Monthly Payment ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">$</span>
                      <input
                        type="number"
                        step={100}
                        className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#7261a3] font-mono animate-none"
                        value={targetPayment}
                        onChange={(e) => setTargetPayment(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">
                        Loan Duration
                      </label>
                      <span className="text-xs font-bold text-[#395756] font-mono bg-[#395756]/10 px-2 py-0.5 rounded">
                        {holdDurationYears} Years
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={TERM_OPTIONS.length - 1}
                      step="1"
                      value={TERM_OPTIONS.indexOf(holdDurationYears)}
                      onChange={(e) => handleTermSliderChange(Number(e.target.value), setHoldDurationYears)}
                      className="w-full h-1.5 rounded-lg bg-slate-150 accent-[#395756] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 font-mono font-medium">
                      {TERM_OPTIONS.map((opt) => (
                        <span key={opt} className={holdDurationYears === opt ? "text-[#395756] font-bold" : ""}>
                          {opt}y
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {scenario === "hold-cost" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Asset Price ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-xs">$</span>
                      <input
                        type="number"
                        step={25000}
                        className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1b3022] font-mono"
                        value={targetCost}
                        onChange={(e) => setTargetCost(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Fixed Annual Interest Rate (%)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">%</span>
                      <input
                        type="number"
                        step={0.125}
                        className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1b3022] font-mono"
                        value={holdInterestRate}
                        onChange={(e) => setHoldInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">
                        Loan Duration
                      </label>
                      <span className="text-xs font-bold text-[#395756] font-mono bg-[#395756]/10 px-2 py-0.5 rounded">
                        {holdCostDurationYears} Years
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={TERM_OPTIONS.length - 1}
                      step="1"
                      value={TERM_OPTIONS.indexOf(holdCostDurationYears)}
                      onChange={(e) => handleTermSliderChange(Number(e.target.value), setHoldCostDurationYears)}
                      className="w-full h-1.5 rounded-lg bg-slate-150 accent-[#395756] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 font-mono font-medium">
                      {TERM_OPTIONS.map((opt) => (
                        <span key={opt} className={holdCostDurationYears === opt ? "text-[#395756] font-bold" : ""}>
                          {opt}y
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {scenario === "hold-principal" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Loan Principal ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">$</span>
                      <input
                        type="number"
                        step={10000}
                        className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#395756] font-mono"
                        value={holdPrincipal}
                        onChange={(e) => setHoldPrincipal(Math.max(100, Number(e.target.value)))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">
                        Loan Duration
                      </label>
                      <span className="text-xs font-bold text-[#395756] font-mono bg-[#395756]/10 px-2 py-0.5 rounded">
                        {holdPrincipalDurationYears} Years
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={TERM_OPTIONS.length - 1}
                      step="1"
                      value={TERM_OPTIONS.indexOf(holdPrincipalDurationYears)}
                      onChange={(e) => handleTermSliderChange(Number(e.target.value), setHoldPrincipalDurationYears)}
                      className="w-full h-1.5 rounded-lg bg-slate-150 accent-[#395756] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 font-mono font-medium">
                      {TERM_OPTIONS.map((opt) => (
                        <span key={opt} className={holdPrincipalDurationYears === opt ? "text-[#395756] font-bold" : ""}>
                          {opt}y
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {scenario === "hold-rate" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Annual Interest Rate (%)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">%</span>
                      <input
                        type="number"
                        step={0.125}
                        className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#7261a3] font-mono"
                        value={holdRateInterestRate}
                        onChange={(e) => setHoldRateInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-semibold text-slate-600 uppercase">
                        Amortization Term Option
                      </label>
                      <span className="text-xs font-bold text-[#395756] font-mono bg-[#395756]/10 px-2 py-0.5 rounded">
                        {holdRateDurationYears} Years
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={TERM_OPTIONS.length - 1}
                      step="1"
                      value={TERM_OPTIONS.indexOf(holdRateDurationYears)}
                      onChange={(e) => handleTermSliderChange(Number(e.target.value), setHoldRateDurationYears)}
                      className="w-full h-1.5 rounded-lg bg-slate-150 accent-[#395756] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-600 font-mono font-medium">
                      {TERM_OPTIONS.map((opt) => (
                        <span key={opt} className={holdRateDurationYears === opt ? "text-[#395756] font-bold" : ""}>
                          {opt}y
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                      Assumed down payment: $0. The principal shown on the chart excludes any down payment.
                    </p>
                  </div>
                </div>
              )}

              {/* Economic Relevance */}
              <div className="bg-[#1b3022]/5 p-4 rounded-xl space-y-2 border border-[#1b3022]/10">
                <h5 className="text-xs font-bold text-[#1b3022] flex items-center gap-1 font-display">
                  <Info className="w-3.5 h-3.5" /> Core Finance Theory
                </h5>
                <div className="text-[11px] text-slate-600 leading-relaxed font-sans">
                  {scenario === "hold-payment" && (
                    <p>
                      As Rates rise, the maximum debt you can service with a constant payment shrinks exponentially. At <strong>3% interest</strong>, you borrow significantly more than at <strong>8% interest</strong>.
                    </p>
                  )}
                  {scenario === "hold-cost" && (
                    <p>
                      Down payment scales principal on a 1-to-1 basis. This chart graphs the perfect straight-line reduction in your monthly cost burden as your down payment increases.
                    </p>
                  )}
                  {scenario === "hold-principal" && (
                    <p>
                      This curve outlines compounding interest drag. For any principal, the required monthly payment increases non-linearly when rates climb.
                    </p>
                  )}
                  {scenario === "hold-rate" && (
                    <p>
                      With a fixed annual interest rate and term, monthly payment grows proportionally with principal. 
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Graph Box */}
            <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
              <PlotlyChart id="fixed-scenario-plotly-container" data={fixedPlotData} layout={fixedPlotLayout} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in text-slate-700">
          {/* Informational Callout */}
          <div className="bg-[#1b3022]/5 border border-[#1b3022]/15 p-5 rounded-2xl flex items-start gap-4">
            <span className="p-3.5 bg-white rounded-xl text-[#1b3022] shadow-xs">
              <Sliders className="w-6 h-6 shrink-0" />
            </span>
            <div className="space-y-1">
              <h4 className="font-bold font-display text-slate-900 text-sm">Advanced Variable Rate Analytics Engine</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Understand risks for variable rates. Simulate and chart dynamic rate schedules, or perform full Monte-Carlo regressions over 500 trials to plot the probability distribution of lifetime interest paid.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* Variable Inputs Panel (Left) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl space-y-6 shadow-xs">
              <h3 className="font-bold text-[#1b3022] border-b border-slate-150 pb-2.5 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#1b3022]" /> Core Parameters
              </h3>

              <div className="space-y-5">
                
                {/* Principal Selection */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Fixed Loan Principal ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">$</span>
                    <input
                      type="number"
                      step={25000}
                      className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1b3022] font-mono text-slate-800"
                      value={varPrincipal}
                      onChange={(e) => setVarPrincipal(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Initial Start Rate */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Starting Annual Interest Rate (%)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-sm">%</span>
                    <input
                      type="number"
                      step={0.125}
                      className="w-full text-sm pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#1b3022] font-mono text-slate-800"
                      value={varStartRate}
                      onChange={(e) => setVarStartRate(Math.max(0.1, Number(e.target.value)))}
                    />
                  </div>
                </div>

                {/* ARM Term selection */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Loan Duration (Years)
                  </label>
                  <select
                    className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-sans font-medium text-slate-700 focus:outline-hidden"
                    value={varTermYears}
                    onChange={(e) => setVarTermYears(Number(e.target.value))}
                  >
                    <option value={15}>15 Years</option>
                    <option value={20}>20 Years</option>
                    <option value={30}>30 Years</option>
                    <option value={40}>40 Years</option>
                  </select>
                </div>

                {/* Initial Fixed Period */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex justify-between">
                    <span>Initial Fixed Rate Term</span>
                    <span className="font-bold text-[#1b3022]">{varFixedYears} Years</span>
                  </label>
                  <select
                    className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-sans font-medium text-slate-700 focus:outline-hidden"
                    value={varFixedYears}
                    onChange={(e) => setVarFixedYears(Number(e.target.value))}
                  >
                    <option value={3}>3-Year initial (3/1 ARM)</option>
                    <option value={5}>5-Year initial (5/1 ARM)</option>
                    <option value={7}>7-Year initial (7/1 ARM)</option>
                    <option value={10}>10-Year initial (10/1 ARM)</option>
                  </select>
                </div>

                {/* Adjustment Periodicity */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Adjustment Cycle Frequency
                  </label>
                  <select
                    className="w-full text-xs px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg font-sans font-medium text-slate-700 focus:outline-hidden"
                    value={varPeriodicity}
                    onChange={(e) => setVarPeriodicity(Number(e.target.value))}
                  >
                    <option value={6}>Every 6 Months</option>
                    <option value={12}>Every 12 Months (Standard)</option>
                    <option value={24}>Every 24 Months</option>
                  </select>
                </div>

                {/* Rate Increase Lifetime Cap */}
                <div className="space-y-1.5">
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

              </div>
            </div>

            {/* Visualizer Frame with Tabbed Views (Right) */}
            <div className="lg:col-span-8 min-w-0 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              
              {/* Internal Sub-navigation Tabs */}
              <div className="flex flex-wrap bg-slate-50 border-b border-slate-150 px-1 gap-1 sm:gap-0">
                <button
                  onClick={() => setVarSubTab("timeline")}
                  className={`flex-1 min-w-[170px] px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    varSubTab === "timeline" ? "border-[#1b3022] text-[#1b3022]" : "border-transparent text-slate-600 hover:text-slate-600"
                  }`}
                >
                  <Hourglass className="w-4 h-4" /> Rate Timeline
                </button>
                
                <button
                  onClick={() => setVarSubTab("montecarlo")}
                  className={`flex-1 min-w-[170px] px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    varSubTab === "montecarlo" ? "border-[#7261a3] text-[#7261a3]" : "border-transparent text-slate-600 hover:text-slate-600"
                  }`}
                >
                  <Gauge className="w-4 h-4" /> Monte-Carlo Simulation
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {varSubTab === "timeline" ? (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Rate schedule Options above graph */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs font-bold text-slate-800 font-display">Simulated Interest Rate Scenario:</span>
                        <p className="text-[10px] text-slate-600 mt-0.5">Choose an algorithm for interest rate drift.</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button
                          onClick={() => setVarTrendScenario("best")}
                          className={`w-full sm:w-auto px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border cursor-pointer text-center ${
                            varTrendScenario === "best"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-100"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          Best Case (Rates Always Decline)
                        </button>
                        
                        <button
                          onClick={() => setVarTrendScenario("average")}
                          className={`w-full sm:w-auto px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border cursor-pointer text-center ${
                            varTrendScenario === "average"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-300 ring-2 ring-indigo-100"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          Average Case (Expected Volatility)
                        </button>

                        <button
                          onClick={() => setVarTrendScenario("worst")}
                          className={`w-full sm:w-auto px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all border cursor-pointer text-center ${
                            varTrendScenario === "worst"
                              ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-100"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          Worst Case (Rates Always Rise to Cap)
                        </button>
                      </div>
                    </div>

                    {/* Timeline 2D graph */}
                    <div className="border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                      <PlotlyChart id="var-timeline-plotly-container" data={timelineChartData} layout={timelineChartLayout} />
                    </div>

                    {/* Visual descriptions and Key indicators */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                        <div className="text-slate-600 text-[9px] uppercase font-bold tracking-wider">Average Monthly Payment</div>
                        <div className="text-lg font-bold text-slate-800 font-mono mt-1">
                          ${Math.round(avgPaymentVal).toLocaleString(undefined, { minimumFractionDigits: 0 })}/mo
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">Weighted budget requirement.</p>
                      </div>

                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                        <div className="text-slate-600 text-[9px] uppercase font-bold tracking-wider">Peak Monthly Payment</div>
                        <div className="text-lg font-bold text-slate-800 font-mono mt-1">
                          ${Math.round(peakPaymentVal).toLocaleString(undefined, { minimumFractionDigits: 0 })}/mo
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">Maximum worst-month liability limit.</p>
                      </div>

                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
                        <div className="text-slate-600 text-[9px] uppercase font-bold tracking-wider">Total Lifetime Interest</div>
                        <div className="text-lg font-bold text-brand-green font-mono mt-1">
                          ${Math.round(totalInterestPaidVal).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">Total financing premium.</p>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    
                    {/* Monte-Carlo Setup and Trigger row */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800 font-display">Stochastic Monte-Carlo Trials (N = 500)</span>
                        <p className="text-[10px] text-slate-600">Random walk of interest rate adjustments.</p>
                      </div>
                      
                      <button
                        onClick={() => setMcTrigger(v => v + 1)}
                        className="w-full md:w-auto py-1.5 px-4 bg-[#7261a3] hover:bg-[#5b4d86] text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Re-Run 500 Trials
                      </button>
                    </div>

                    {/* Monte-Carlo histogram */}
                    <div className="border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                      <PlotlyChart id="var-mc-plotly-container" data={mcChartData} layout={mcChartLayout} />
                    </div>

                    {/* Statistical Summary Grid */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">Simulated Stats Spectrum</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        
                        <div className="bg-emerald-50/50 border border-emerald-100 p-3.5 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-emerald-800 block uppercase">Min Interest</span>
                          <span className="text-sm font-bold text-emerald-700 font-mono block mt-1">
                            ${Math.round(mcMin).toLocaleString()}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-slate-600 block uppercase">10th% (Optimistic)</span>
                          <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                            ${Math.round(mcP10).toLocaleString()}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-slate-600 block uppercase">Median (50th%)</span>
                          <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                            ${Math.round(mcP50).toLocaleString()}
                          </span>
                        </div>

                        <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-slate-600 block uppercase">90th% (Pessimistic)</span>
                          <span className="text-sm font-bold text-slate-800 font-mono block mt-1">
                            ${Math.round(mcP90).toLocaleString()}
                          </span>
                        </div>

                        <div className="bg-rose-50/50 border border-rose-100 p-3.5 rounded-xl text-center col-span-2 md:col-span-1">
                          <span className="text-[9px] font-bold text-rose-800 block uppercase">Max Interest</span>
                          <span className="text-sm font-bold text-rose-700 font-mono block mt-1">
                            ${Math.round(mcMax).toLocaleString()}
                          </span>
                        </div>

                      </div>
                    </div>

                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
