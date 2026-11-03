import { ArrowLeft, Landmark } from "lucide-react";

interface MortgageTermsKnowledgeBasePageProps {
  onNavigate: (page: string) => void;
}

export default function MortgageTermsKnowledgeBasePage({ onNavigate }: MortgageTermsKnowledgeBasePageProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <button
        onClick={() => onNavigate("kb-mortgages")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-purple hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Mortgages
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
          <Landmark className="h-3.5 w-3.5" /> Mortgages Article
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 font-display">
          Mortgage Loan Terms
        </h1>
        <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
          Mortgage terms determine your monthly affordability and your long-term borrowing cost. The most
          important choices include down payment amount, interest rate structure, loan term length, and
          monthly payment target. These choices are reviewed and finalized through underwriting.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">Down Payment Strategy</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your down payment directly affects loan size, interest cost, and qualification strength. A larger down
          payment reduces principal, usually lowers monthly payment, and may help you avoid private mortgage
          insurance. A smaller down payment preserves cash, but often increases total borrowing cost.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The best down payment depends on your full plan, not just one rule of thumb. You should compare how
          much cash you keep after closing, expected emergency reserves, and whether the payment comfortably fits
          your monthly budget in both normal and stress scenarios.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Questions to evaluate:
          <br/>
          <ul className="list-disc pl-5 space-y-1">
            <li>Will this down payment leave enough emergency savings after closing?</li>
            <li>Will a larger down payment remove PMI or materially improve terms?</li>
            <li>Does preserving cash matter more than reducing monthly payment right now?</li>
          </ul>
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Home buyers may wish to keep some of the funds they would use for a down payment for home improvements or 
          remodeling after the purchase. In such cases, home improvements increase the value of the property and 
          therefore increase equity, but they do not increase equity as much as a direct down payment, because improvements usually only 
          recoup a portion of the investment in value, unlike a down payment which converts 100% to equity. However, 
          it can still be a valid plan if the buyer prioritizes the value of the property over equity. It is generally 
          more common for buyers who plan to stay in the home for many years to prioritize value over equity, while 
          buyers who plan to flip the property or stay for a short time are more likely to prioritize equity over value. 
        </p>
        <br/>
        <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Monthly Payment, Rate, and Years</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Monthly payment is shaped by principal, interest rate, and term years. Shorter terms usually carry
          higher monthly payments but lower total interest. Longer terms usually lower monthly payments but
          increase total interest over the life of the loan.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Interest rate structure also matters. Fixed rates provide payment consistency, while adjustable rates can
          start lower but may increase later. Choosing between them depends on your timeline in the home and your
          tolerance for payment variability.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Practical comparison approach:
          <br/>
          <ul className="list-disc pl-5 space-y-1">
            <li>Model multiple terms (for example 15, 20, and 30 years).</li>
            <li>Compare fixed versus adjustable scenarios over your expected hold period.</li>
            <li>Measure both monthly affordability and total interest paid.</li>
          </ul>
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This app was created precisely to help you answer questions like this. Visit the <a href="/?page=compareLoans" className="text-accent-purple hover:underline">loan comparison tool</a> to 
          compare two mortgage terms side by side, or visit the <a href="/?page=scenarios" className="text-accent-purple hover:underline">variable scenarios page</a> to start with a single goal 
          (e.g. setting a target monthly payment) and exploring what combinations of the other terms achieve that goal.
        </p>
        <br/>
        <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Underwriting and Amortization Impact</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Borrowers propose terms, but the underwriter determines final approved terms based on income stability,
          debt obligations, credit profile, and property valuation. If risk appears higher, underwriters may require
          stronger documentation, pricing adjustments, or different loan conditions.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Every approved term choice changes your amortization path. Early payments are mostly interest, and
          principal reduction accelerates later. A lower rate, shorter term, or additional principal payment can
          shift amortization materially and reduce lifetime interest.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Key amortization effects:
          <br/>
          <ul className="list-disc pl-5 space-y-1">
            <li>A lower rate means less interest each month, smaller monthly payment, and faster equity growth.</li>
            <li>A shorter term means higher monthly payments but accelerated payoff.</li>
            <li>Extra principal payments reduce remaining term and total interest. The <a href="/?page=paymentScenarios" className="text-accent-purple hover:underline">payment scenarios tool</a> shows how extra payments impact your total interest paid and payoff timeline.</li>
          </ul>
        </p>
        <br/>
        <h2 className="mt-6 text-lg font-bold text-slate-900">The Bottom Line</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          <strong>The best mortgage terms match your goals, risk tolerance, and cash flow while still meeting
          underwriting standards. Always evaluate how each term changes amortization over time.</strong>
        </p>
      </div>

      <button
        onClick={() => onNavigate("kb-mortgages-property-assets")}
        className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
      >
        Next: Using Property as a Financial Asset
      </button>

    </section>
  );
}