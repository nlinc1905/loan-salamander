import { ArrowLeft, Landmark } from "lucide-react";

interface PropertyAssetsKnowledgeBasePageProps {
  onNavigate: (page: string) => void;
}

export default function PropertyAssetsKnowledgeBasePage({ onNavigate }: PropertyAssetsKnowledgeBasePageProps) {
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
          Using Property as a Financial Asset
        </h1>
        <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
          Real estate is more than housing. Over time, home equity can become a financial resource that supports
          liquidity needs, investment plans, or retirement cash flow. The key is understanding the tools and risks
          before borrowing against property value.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">Home Equity as Borrowing Capacity</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          <strong>Equity</strong> is the portion of your property value you own after subtracting mortgage balances. 
          For example, if you took a mortgage for $300,000 on a home worth $400,000, you would have $100,000 in equity. 
          As you repay principal and as home value changes, the equity portion increases. There are financial 
          tools that allow you to borrow against this equity, such as HELOCs, home equity loans, and cash-out 
          refinancing. For many homeowners, their home is their largest asset, making it a flexible source of 
          borrowing power when used responsibly.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Equity loans are secured using the home as collateral. Using equity can be less expensive than unsecured 
          borrowing, but it puts the home at risk if payments are missed. Equity should therefore be used for 
          high-value purposes and with a clear repayment plan.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Examples of equity-based loan uses:
          <br/>
          <ul className="list-disc pl-5 space-y-1">
            <li>Major repairs that preserve or increase property value.</li>
            <li>Debt restructuring when rates and terms are materially better.</li>
            <li>Bridge liquidity for planned expenses with a defined payoff timeline, such as using equity to fund 
                the down payment on a new property, before selling the old one.
            </li>
          </ul>
        </p>
        <br/>
        <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">HELOCs, Home Equity Loans, and Cash-Out Refinancing</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          A <strong>home equity line of credit (HELOC)</strong> provides a revolving credit line secured by your home. Lenders will often order a property appraisal 
          to determine your home's current value and compare that with the principal balance on any existing mortgage 
          to calculate equity. Then they will use a portion of that equity, like 80%, to determine the limit of the 
          credit line. Like any line of credit, you can draw funds as needed, and redraw the funds if you pay down the 
          balance. During the draw period of the loan, you only need to pay interest on the amount drawn. HELOC loans 
          are good for managing ongoing expenses where you may not know the total amount needed upfront, like paying 
          business startup costs, bridging financial gaps during periods of unemployment, or purchasing a second home. 
          Interest rates on HELOCs are typically variable, which means your interest payments 
          can change over time.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          A <strong>home equity loan</strong> is a second mortgage that provides a lump sum of cash with a fixed 
          interest rate and fixed monthly payments over a set term. It is useful when you know the total amount 
          needed upfront, such as for debt consolidation, a home renovation with known costs, purchasing a rental property, medical bills, 
          emergency expenses, business investments, or college tuition.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          A <strong>cash-out refinance</strong> replaces an existing mortgage with a new, larger mortgage, and keeping 
          the difference between the mortgage principals as cash. For example, if you have an existing mortgage for 
          $100,000 and you refinance for $150,000, you would receive $50,000 in cash. Cash-out refinancing is often 
          useful for funding home improvements, consolidating debt, and paying for investments or second properties 
          to expand a real estate portfolio. The drawbacks are that the mortgage payment clock is reset with the 
          new loan, and total interest paid over the life of the loan increases due to the larger principal and 
          extended term. You can use the <a href="/?page=refinance" className="text-accent-purple hover:underline">refinance calculator</a> to estimate 
          potential cash-out refinancing scenarios.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Before using any equity product:
          <br/>
          <ul className="list-disc pl-5 space-y-1">
            <li>Compare total cost of the loan (interest, application fees, points, appraisal fees, etc.), not just advertised rates.</li>
            <li>Model payments under higher-rate scenarios, including potential future rate increases for adjustable-rate loans. The <a href="/?page=scenarios" className="text-accent-purple hover:underline">rate scenario simulator</a> can help with this.</li>
            <li>Confirm fees, draw periods, and repayment terms.</li>
            <li>Consider the impact on your overall financial plan, including how the new debt affects your cash flow, savings, and long-term goals.</li>
          </ul>
        </p>
        <br/>
        <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Reverse Mortgages and Late-Life Planning</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          A <strong>reverse mortgage</strong> is a mortgage loan secured by a home that allows homeowners to access home 
          equity as cash. These loans are typically used by older homeowners who either own their home outright or 
          have a large portion of equity. Using a reverse mortgage, homeowners can convert equity into cash for 
          living expenses, health care costs, or income support, generally without required monthly principal and 
          interest payments, and while living in the home. A common use is supplementing retirement income.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Reverse mortgages end when the homeowner sells the home, moves out permanently, or dies. At that point, 
          the loan becomes due, typically requiring repayment from the sale of the home. For this reason, a reverse 
          mortgage reduces any inheritance that would otherwise pass to heirs.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Interest on the loan accrues over time, increasing the balance owed, but since no payments are due, the balance 
          can eventually exceed the value of the home, especially if the home value declines or the homeowner lives for a 
          long time. However, if this happens, the excess is not required to be repaid.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          These products can be useful for some households, but they involve fees, balance growth over time, and
          estate implications for heirs. Borrowers should review occupancy, property tax, and maintenance
          requirements carefully because noncompliance can trigger default.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Decision safeguards:
          <br/>
          <ul className="list-disc pl-5 space-y-1">
            <li>Reverse mortgages are complex, so it is important to clearly understand all terms. 
                It is often recommended to use independent counseling before finalizing terms.
            </li>
            <li>Discuss estate and inheritance goals with family and advisors before obtaining a reverse mortgage.</li>
            <li>Compare reverse mortgage outcomes with downsizing or other options.</li>
          </ul>
        </p>
        <br/>
        <h2 className="mt-6 text-lg font-bold text-slate-900">The Bottom Line</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          <strong>Property can be a powerful financial tool through equity lending and retirement products, but
          every option trades future home equity for current cash. Use these tools deliberately and plan for risk.</strong>
        </p>
      </div>

      <button
        onClick={() => onNavigate("kb-auto-loans")}
        className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
      >
        Next: Auto Loans
      </button>

    </section>
  );
}