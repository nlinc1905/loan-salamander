import { ArrowLeft, CircleDollarSign } from "lucide-react";

interface LoanBasicsKnowledgeBasePageProps {
  onNavigate: (page: string) => void;
}

export default function LoanBasicsKnowledgeBasePage({ onNavigate }: LoanBasicsKnowledgeBasePageProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <button
        onClick={() => onNavigate("kb")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-purple hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to knowledge base
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-purple/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-purple">
          <CircleDollarSign className="h-3.5 w-3.5" /> Loan Basics
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-display">Loan Basics</h1>
        <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
          Loan basics are the building blocks for understanding any borrowing decision. Before comparing products or running scenarios,
          it helps to know how principal, interest, term length, and amortization work.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">Section Contents</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 list-disc pl-5">
          <li>
            Loan Basics (this page)
          </li>
          <li>
            <button
              onClick={() => onNavigate("kb-loan-basics-fixed-variable-interest")}
              className="text-accent-purple hover:underline"
            >
              Fixed vs Variable Rate Interest
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("kb-loan-basics-secured-unsecured")}
              className="text-accent-purple hover:underline"
            >
              Secured vs Unsecured Loans
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("kb-loan-basics-revolving-loans")}
              className="text-accent-purple hover:underline"
            >
              Revolving Loans
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("kb-loan-basics-credit-score")}
              className="text-accent-purple hover:underline"
            >
              Credit Score
            </button>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">The Economics of Borrowing</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Some things in life are too expensive to pay for with one large payment. Sometimes you may be able to 
          make one large payment, but it makes more sense to spread the cost over time. Loans allow you to do this 
          by borrowing money and repaying it over a set time period. 
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          When you borrow money, you are asking someone else to make the large payment for you. The person or entity 
          you borrow from is called a <strong>lender</strong> (also known as a <strong>creditor</strong>). 
          A lender provides the funds upfront, and you agree to repay them over time.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Lenders are willing to provide the funds upfront because they expect to be compensated for the risk of 
          you not paying them back, and the opportunity cost of lending you the money instead of using it elsewhere 
          (and potentially earning a return elsewhere). Their compensation is called <strong>interest</strong>. 
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Interest</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Interest is typically expressed as a percentage of the amount you borrow (the <strong>principal</strong>). 
          Lenders set the interest rate based on the risk of lending to you and the prevailing market conditions. 
          If you cannot repay the loan (in other words, you <strong>default</strong> on the loan), they would not 
          get their money back, so the interest compensates them for the risk of lending to you. Interest also 
          compensates lenders for the opportunity cost of lending money instead of using it elsewhere. For instance, 
          if a lender could have invested the money elsewhere and earned a return, they forgo that opportunity by 
          lending to you, so the interest compensates them for that lost potential gain.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          From a borrower's perspective, the interest is the cost of borrowing money, because it represents the 
          extra amount you must pay in addition to repaying the principal. While interest is an amount, it is 
          typically expressed as a percentage of the principal, which is known as the <strong>interest rate</strong>. 
          The interest rate is important because it allows borrowers to understand the cost of borrowing relative to 
          the amount they are borrowing. It provides a standardized way to compare different loans and their costs. 
          So when evaluating loan options, borrowers can look at the interest rate to gauge which loan is more 
          affordable in terms of the extra amount they will need to pay over time.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          In short, a lower interest rate is better for the borrower and a higher interest rate is better for 
          the lender. 
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Simple vs Compound Interest</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          It is important to understand the difference between simple and compound interest because it can drastically 
          affect the total amount of interest you will pay over the life of the loan.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          <strong>Simple interest</strong> is calculated only on the principal amount, 
          which means the interest is calculated only on the original amount you borrowed, not on any interest 
          that accrues over time.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          <strong>Compound interest</strong> is calculated on the principal plus any interest that has already 
          been added to it, which means that interest is calculated not only on the original amount borrowed but 
          also on the interest that has accrued over time. As a borrower, this means loans with compounded interest 
          should be managed carefully because the interest can grow much faster than with simple interest, 
          leading to higher overall costs, longer repayment periods, and greater financial burden.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          In mathematical terms, simple interest grows linearly over time, meaning it follows a straight-line 
          constant growth pattern, while compound interest grows exponentially, meaning it follows an increasingly 
          growing curve over time.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Whether a loan uses simple or compound interest depends on the type of loan and the terms set by the lender. 
          For example, many personal loans and student loans use simple interest, while mortgages and auto loans use 
          monthly compound interest, and credit cards often use daily compound interest. This is why financial 
          advisors often encourage borrowers to pay down credit cards before reducing other types of debt. 
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Loan Period and Term</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The <strong>period</strong> or <strong>term</strong> of a loan refers to the length of time over 
          which the borrower is expected to repay the loan. For example, a 30-year mortgage has a period of 
          30 years.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Loan period is a key factor in determining the total interest paid, and the size of the periodic payments, 
          because longer loan periods give interest more time to accrue, especially in the case of compound interest. 
          This is why borrowers often aim to balance the loan period with manageable payment amounts to avoid 
          excessive interest accumulation over time. Longer loan periods result in smaller monthly payments but 
          higher total interest paid over the life of the loan, while shorter loan periods result in larger 
          monthly payments but lower total interest paid. So if you are worried about monthly cost, you may prefer 
          a loan with a longer period, accepting that you will ultimately pay more interest over the life of the loan. 
          Alternatively, if you are worried about the interest or cost of the loan, you may prefer a loan with a 
          shorter period, accepting a larger monthly payment.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Amortization</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Most loans are repaid in monthly installments. This means the borrower makes a payment each month that 
          covers both the interest accrued and a portion of the principal. Over time, as the principal decreases, 
          the interest portion of the payment decreases, and the principal portion increases, gradually reducing 
          the outstanding loan balance until it is fully repaid. This process of gradually paying down the loan 
          through regular payments is known as <strong>amortization</strong>.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Amortization ensures that the loan is systematically paid off over time, with each payment contributing 
          to both interest and principal reduction. This structured repayment schedule helps borrowers plan 
          their finances and understand how their payments impact the loan balance. 
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          A common misconception is that monthly payments pay the interest of a loan first, before paying down the 
          principal, making it seem like the lender is purposefully delaying the reduction of the loan balance. This 
          is false. It seems like the interest is being paid first because at the beginning of the loan, 
          the outstanding principal is high, so the interest portion of each payment is larger. As the principal 
          decreases over time, the interest portion decreases and the principal portion increases. You can see 
          this pattern clearly if you look at an <a href="/?page=calculator" className="text-accent-purple hover:underline">amortization schedule</a>, 
          which shows how each payment is split between interest and principal over the life of the loan.
        </p>
      </div>

    <button
      onClick={() => onNavigate("kb-loan-basics-fixed-variable-interest")}
      className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
    >
      Next: Fixed vs Variable Interest
    </button>

    </section>
  );
}
