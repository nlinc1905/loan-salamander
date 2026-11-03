import { ArrowLeft, CircleDollarSign } from "lucide-react";

interface RevolvingLoansKnowledgeBasePageProps {
  onNavigate: (page: string) => void;
}

export default function RevolvingLoansKnowledgeBasePage({ onNavigate }: RevolvingLoansKnowledgeBasePageProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <button
        onClick={() => onNavigate("kb-loan-basics")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-purple hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Loan Basics
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
          <CircleDollarSign className="h-3.5 w-3.5" /> Loan Basics Article
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 font-display">
          Revolving Loans
        </h1>
        <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
          Revolving credit works differently from a standard installment loan. Instead of borrowing one fixed amount once,
          you receive a credit limit and can borrow, repay, and borrow again as long as the account remains open and in good standing.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
          <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">How Revolving Credit Works</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Revolving credit allows borrowers to access funds up to a certain limit repeatedly. Unlike a 
            term loan where you borrow a fixed amount and repay it over time until the loan is fully paid off, 
            a revolving credit account gives you flexibility to borrow, repay, and borrow again as needed. 
            Credit cards are the most common example. You can carry a balance from one period to the next,
            and interest is charged only on the amount you actually use rather than the full limit.
          </p>
          <br/>
          <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Benefits of Revolving Credit</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Revolving credit provides flexibility because you can borrow only what you need and pay interest only on 
            the outstanding balance after each statement due date. It is also re-usable as you pay it, 
            so if you repay part of the credit, it becomes available to borrow again without needing to 
            re-apply for a new loan. As long as the account is in good standing, it can remain open even if 
            unused, until either the borrower or lender decides to close it.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Revolving credit is ideal for managing short-term cash needs like unexpected expenses. Businesses may use 
            revolving credit to cover temporary gaps in cash flow or to finance short-term operational needs. For 
            example, a business that sells Christmas trees may need to purchase inventory in advance of the holiday 
            season, when it does not yet have sales revenue, so it can use revolving credit to cover the gap until 
            sales revenue comes in. As another example, home buyers may use revolving credit to cover their down 
            payment on a new property before securing a mortgage or other long-term financing. A common scenario is 
            existing home-owners financing the down payment of their new home with a line of credit on the equity of 
            their current home, and paying back the borrowed amount upon the sale of that home.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Revolving credit can be secured or unsecured. Home equity lines of credit (HELOC) and securities backed 
            lines of credit (SBLOC) are examples of secured revolving credit, where the collateral is the borrower's 
            home equity or investment portfolio, respectively.
          </p> 
          <br/>
          <h2 className="text-xl font-bold text-slate-900 font-display">Costs and Risks of Revolving Credit</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Revolving accounts often have higher interest rates than term loans, even if they are secured. 
            If a balance is carried month to month, interest can accumulate quickly, especially if the lender 
            compounds frequently and the borrower pays only the minimum due. This is why credit card debt can 
            quickly become unmanageable if not paid off promptly.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            As an example, consider a credit card with a 
            20% annual interest rate and a $15,000 balance. In this scenario, the minimum payment would be 
            $400 per month (assuming it is calculated from the interest + 1% of the balance), and since the 
            principal is large, a significant portion of the payment goes toward 
            interest rather than reducing the principal. If only the minimum payment is made each month, it would 
            take more than 32 years to pay off the balance, and the total interest paid would be more than $24k. 
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Despite the risks, if revolving credit is carefully managed, it can be a good way to build 
            credit history and improve one's credit score.
          </p>
      </div>

      <button
          onClick={() => onNavigate("kb-loan-basics-credit-score")}
          className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
      >
          Next: Credit Score
      </button>

    </section>
  );
}