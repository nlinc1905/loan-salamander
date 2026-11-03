import {
  TrendingUp,
  Shell,
  Calculator,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  Coins,
  Copy,
  RefreshCw,
} from "lucide-react";

const variableScenarioScreenshot = new URL("../../assets/variable_scenario_screenshot.png", import.meta.url).href;

interface FrontPageProps {
  isSignedIn: boolean;
  onNavigate: (page: string) => void;
}

export default function FrontPage({ isSignedIn, onNavigate }: FrontPageProps) {
  return (
    <div className="bg-slate-50 min-h-screen">
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-purple/10 border border-accent-purple/20 rounded-full text-accent-purple text-xs font-semibold uppercase tracking-wider">
              <Shell className="w-3 h-3" /> Resilient Loan Planning
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 font-display leading-[1.1]">
              Explore scenarios. <br />
              <span className="text-accent-purple bg-linear-to-r from-accent-purple to-accent-lavender bg-clip-text text-transparent">
                Save thousands
              </span>{" "}
              on loans.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-lg leading-relaxed">
              Take control of your financial future. Model mortgages, student, auto, and other loans with precision.
              Simulate trade-offs to find the best strategy for your goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                id="cta-start-planning"
                onClick={() => onNavigate("calculator")}
                className="inline-flex items-center justify-center px-6 py-3 bg-accent-purple text-white font-medium rounded-xl hover:bg-accent-slate transition shadow-xs hover:shadow-md cursor-pointer group"
              >
                Start Planning
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
              </button>

              {!isSignedIn && (
                <button
                  id="cta-create-account"
                  onClick={() => onNavigate("profile")}
                  className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  Create Account / Sign In
                </button>
              )}
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500 font-mono pt-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-accent-teal" />
                Self-Hosted
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-accent-teal" />
                Local Data Storage
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-accent-teal" />
                All Features Included
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-lg bg-slate-200 border border-slate-100 rounded-3xl p-4 shadow-xl text-white font-mono text-xs relative">
            <div className="w-full h-full min-h-[320px] rounded-2xl overflow-hidden bg-slate-250/60">
              <img src={variableScenarioScreenshot} alt="Variable scenario preview" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white px-6 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-16">
            <span className="text-accent-purple text-xs font-mono font-bold uppercase tracking-widest">How It Helps</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Professional Grade Planning Tools
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              Whether you are borrowing for a home, vehicle, education, or anything else, this loan planner gives
              you the clarity and confidence to move forward.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard icon={<Calculator className="w-5 h-5" />} title="Amortization Calculator" body="See cumulative principal and interest over time, model fixed or variable rates, and export results." />
            <FeatureCard icon={<TrendingUp className="w-5 h-5" />} title="Variable Scenarios" body="Explore affordability curves and stress-test variable-rate outcomes to understand risk." />
            <FeatureCard icon={<Coins className="w-5 h-5" />} title="Payment Scenarios" body="Measure how recurring or one-time extra payments affect payoff time and total interest." />
          </div>

          <div className="mt-8 flex flex-col md:flex-row items-stretch justify-center gap-8">
            <div className="w-full md:w-[31%]">
              <FeatureCard icon={<Copy className="w-5 h-5" />} title="Compare Loans" body="Compare two loan structures side by side to pick the option that best fits your plan." />
            </div>
            <div className="w-full md:w-[31%]">
              <FeatureCard icon={<RefreshCw className="w-5 h-5" />} title="Refinance Scenarios" body="Estimate break-even points and long-term trade-offs when evaluating refinance options." />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-slate-50 p-6 rounded-2xl hover:bg-slate-100/70 transition border border-slate-100">
      <div className="w-10 h-10 rounded-lg bg-accent-purple/15 flex items-center justify-center text-accent-purple mb-4">{icon}</div>
      <h4 className="text-lg font-bold font-display text-slate-900">{title}</h4>
      <p className="text-slate-600 text-sm mt-2 leading-relaxed">{body}</p>
    </div>
  );
}
