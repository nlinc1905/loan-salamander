import { ArrowLeft, CarFront } from "lucide-react";

interface AutoLoansKnowledgeBasePageProps {
  onNavigate: (page: string) => void;
}

export default function AutoLoansKnowledgeBasePage({ onNavigate }: AutoLoansKnowledgeBasePageProps) {
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
          <CarFront className="h-3.5 w-3.5" /> Auto Loans
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-display">Auto Loans</h1>
        <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
          Auto loans are installment loans that help borrowers finance a vehicle over time. Understanding term
          length, interest rates, down payments, and depreciation can help you choose financing that fits your
          monthly budget and long-term goals.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">Section Contents</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 list-disc pl-5">
          <li>
            Auto Loans (this page)
          </li>
          {/* <li>
            <button
              onClick={() => {}}
              className="text-accent-purple hover:underline"
            >
              Placeholder Topic 1
            </button>
          </li> */}
        </ul>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">How Auto Loans Work</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Auto loans are usually fixed-term installment loans secured by the vehicle. The lender pays the dealer
          or seller, and the borrower repays the lender with monthly payments over a defined term such as 36,
          48, 60, or 72 months.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Monthly payment is mainly driven by the financed amount, interest rate, and term length. A larger down
          payment or trade-in value lowers the financed balance. A lower rate lowers borrowing cost. A longer term
          lowers monthly payment but often increases total interest paid.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Because auto loans are secured, missing payments can result in repossession. Borrowers should evaluate
          total loan cost, not just monthly payment, and compare offers from multiple lenders before committing.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Auto Loan Considerations</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Vehicles generally depreciate over time, so loan structure matters. If the loan balance falls slowly,
          borrowers can be upside down, meaning they owe more than the vehicle is worth. Keeping terms reasonable
          and avoiding overfinancing can reduce that risk.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          It is helpful to set a target monthly payment before shopping and then work backward to a realistic
          vehicle price. This approach helps borrowers avoid stretching their budget and protects room for savings,
          insurance, and maintenance costs.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Auto Loan Interest Rates</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Interest rates on auto loans vary based on the borrower's credit profile, loan term, and market conditions. 
          Borrowers with higher credit scores typically receive lower rates, while longer terms may carry higher rates. 
          Comparing rates from multiple lenders can help secure the best financing terms.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Warnings About Dealer Financing</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Obtaining a loan from a lender is referred to as <strong>direct</strong> financing, where the borrower 
          works directly with the lender to secure financing. Alternatively, obtaining a loan through a dealership 
          or broker who arranges the financing on behalf of the borrower is referred to as <strong>indirect</strong> financing. 
          Direct financing typically allows the borrower to negotiate terms directly with the lender, while indirect 
          financing may involve additional fees or markups added by the dealership or broker.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          As a borrower, if you use indirect financing, there are some things to be aware of. First, dealerships add 
          markups to interest rates provided by lenders to get extra profit from selling the vehicle. This usually 
          means indirect financing is more expensive than direct financing. Upon obtaining indirect financing, the 
          dealer sells the loan to a third-party lender, who becomes the actual lender for the loan, although you may 
          not notice anything as the dealer can still act as the loan servicer. Since the dealer markup rate is not 
          tied to the borrower's creditworthiness, it can result in higher interest costs for borrowers with good 
          credit, as the dealer markup is applied regardless of the borrower's credit profile.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          A common sales tactic at dealerships is for the sales staff to ask for your target monthly payment, and then 
          structure the car sale around that. The price of the car, minus any down payment or trade-in results in the 
          principal, so they determine which principal, interest, and loan term give them the best profit. The loan 
          terms are therefore adjusted to meet your target monthly payment, which obscures the total cost of the loan. 
          This can lead to longer loan terms or higher interest rates that increase the overall cost of the vehicle. 
          Often, the sales staff will provide quotes for the vehicle without showing the interest rate they used to 
          come up with it. Fortunately, you can use the <a href="/?page=scenarios" className="text-accent-purple underline">variable scenarios</a> tool 
          to determine the interest rate they used behind the scenes and see the true cost of the loan. 
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Another common tactic is to make you wait while they check with multiple lenders or run your credit. The 
          time it takes to get responses from lenders and calculate these numbers is negligible, so the wait is mostly 
          just to wear you down. The sales staff may also warn you that negotiating will force them to run 
          your credit again, potentially impacting your credit score, but that is a lie because multiple inquires 
          are consolidated into one, as long as they happen within a short period (typically 45 days). Here are a few 
          other deceptive practices to watch for when using indirect financing through a dealer:
          <br/>
          <ul className="list-disc pl-5 space-y-1">
            <li>Packing extra "mandatory" fees or unwanted add-ons into the monthly payment, when they are all optional.</li>
            <li>Marking up the interest rate without disclosing it to you.</li>
            <li>Lying about your credit score.</li>
            <li>Extending the loan term to lower monthly payments while increasing total interest paid.</li>
            <li>Pressuring you to accept financing terms quickly without comparison shopping.</li>
            <li>Letting you drive away with the vehicle under "approved" terms, then contacting you later to claim the loan fell through and offering you a more expensive one instead.</li>
          </ul>
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Always use the <a href="/?page=scenarios" className="text-accent-purple underline">variable scenarios</a> tool 
          when in doubt, as it allows you to see the true principal, interest, loan term, and monthly payment combinations 
          for any fixed rate loan.
        </p>
      </div>

      <button
        onClick={() => onNavigate("kb-student-loans")}
        className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
      >
        Next: Student Loans
      </button>
    </section>
  );
}
