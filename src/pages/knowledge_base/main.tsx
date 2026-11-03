import { BookOpen, CircleDollarSign, GraduationCap, CarFront, Home, ShieldCheck, ArrowRight } from "lucide-react";

interface KnowledgeBaseMainPageProps {
  onNavigate: (page: string) => void;
}

const categories = [
  {
    title: "Loan Basics",
    description: "Core concepts like principal, interest, term length, amortization, and loan-to-value.",
    page: "kb-loan-basics",
    icon: CircleDollarSign,
  },
  {
    title: "Managing Debt",
    description: "Strategies for budgeting, payoff order, refinancing trade-offs, and staying organized.",
    page: "kb-managing-debt",
    icon: ShieldCheck,
  },
  {
    title: "Mortgages",
    description: "Home loan concepts including down payments, escrow, fixed vs variable rates, and closing costs.",
    page: "kb-mortgages",
    icon: Home,
  },
  {
    title: "Student Loans",
    description: "Understand federal and private loans, repayment plans, deferment, and interest capitalization.",
    page: "kb-student-loans",
    icon: GraduationCap,
  },
  {
    title: "Auto Loans",
    description: "Learn about automobile loan terms, APR, depreciation, and trade-in equity.",
    page: "kb-auto-loans",
    icon: CarFront,
  },
];

export default function KnowledgeBaseMainPage({ onNavigate }: KnowledgeBaseMainPageProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-12">
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.22),transparent_35%),radial-gradient(circle_at_right,rgba(45,212,191,0.18),transparent_30%)]" />
        <div className="relative p-8 sm:p-12 lg:p-16 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
            <BookOpen className="h-3.5 w-3.5" /> Loan Planning Knowledge Base
          </div>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display leading-tight">
              Learn the language of loans.
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-7 max-w-2xl">
              This knowledge base is a practical financial reference for borrowers and planners.
              Start with the fundamentals, then move into mortgage, student loan, auto loan, and debt management topics.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate("kb-loan-basics")}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-purple px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-lavender"
            >
              Explore Loan Basics
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent-purple">Categories</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 font-display">Start with a category</h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.page}
                onClick={() => onNavigate(category.page)}
                className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent-purple/30 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900 transition group-hover:bg-accent-purple group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-display">{category.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-purple">
                  Read overview
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">Goals of this knowledge base</p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>Explain loan terminology in plain language.</li>
            <li>Support borrowers by reducing information asymmetry with lenders.</li>
            <li>Help users understand how these tools work, and which tools to use for different scenarios.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
