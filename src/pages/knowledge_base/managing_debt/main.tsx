import { ArrowLeft, CircleSlash2, HandCoins, ShieldCheck } from "lucide-react";

interface ManagingDebtKnowledgeBasePageProps {
  onNavigate: (page: string) => void;
}

export default function ManagingDebtKnowledgeBasePage({ onNavigate }: ManagingDebtKnowledgeBasePageProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <button
        onClick={() => onNavigate("kb")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-purple hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to knowledge base
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-teal/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-teal">
          <CircleSlash2 className="h-3.5 w-3.5" /> Managing Debt
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display">Managing Debt</h1>
        <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
          Managing debt is about intelligently leveraging debt, building a payment plan that fits your budget 
          while minimizing long-term cost. The right strategy depends on
          how you use your debt, your rates, monthly cash flow, and whether you want to pay off balances faster or 
          preserve flexibility.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">Section Contents</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 list-disc pl-5">
          <li>Managing Debt (this page)</li>
          <li>
            <button
              onClick={() => onNavigate("kb-managing-debt-good-vs-bad-debt")}
              className="text-accent-purple hover:underline"
            >
              Good vs Bad Debt
            </button>
          </li>
          <li>
                        <button
              onClick={() => onNavigate("kb-managing-debt-strategies-to-pay-down-debt")}
              className="text-accent-purple hover:underline"
            >
              Strategies to Pay Down Debt
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("kb-managing-debt-default-bankruptcy")}
              className="text-accent-purple hover:underline"
            >
              Missed Payments, Default, and Bankruptcy
            </button>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">Debt is Not Always Bad</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Managing debt is not about avoiding or minimizing debt, but about using debt effectively to 
          achieve your goals. You will inevitably need to borrow money at some point, whether for a large purchase, 
          an investment, or to manage cash flow. It is useful to understand when and how to take on debt, so that 
          it does not become too much of a burden on your finances.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">When Debt Becomes a Burden</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Debt becomes a burden when it exceeds your ability to manage it effectively. High-interest debt, 
          missed payments, and over-leveraging can strain your finances and limit your financial flexibility. 
          Understanding the warning signs and taking proactive steps can help prevent debt from becoming overwhelming. 
          If it does become overwhelming, there are steps you can take to course correct, such as creating a debt 
          repayment plan, negotiating with creditors, or seeking professional financial advice. These topics will be 
          explored in more detail in the following sections.
        </p>
      </div>

    <button
      onClick={() => onNavigate("kb-managing-debt-good-vs-bad-debt")}
      className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
    >
      Next: Good vs Bad Debt
    </button>

    </section>
  );
}
