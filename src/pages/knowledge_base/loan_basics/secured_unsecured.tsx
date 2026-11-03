import { ArrowLeft, CircleDollarSign, ShieldCheck, TriangleAlert } from "lucide-react";

interface SecuredUnsecuredKnowledgeBasePageProps {
  onNavigate: (page: string) => void;
}

export default function SecuredUnsecuredKnowledgeBasePage({ onNavigate }: SecuredUnsecuredKnowledgeBasePageProps) {
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
          Secured vs unsecured loans
        </h1>
        <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
          One of the most important differences between loans is whether the lender has <strong>collateral</strong> backing the debt. 
          Collateral is something valuable that the borrower can surrender to the lender if the borrower defaults. <strong>Secured loans</strong> are 
          tied to an asset used as collateral, while <strong>unsecured loans</strong> rely on the borrower's creditworthiness.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
          <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Secured Loans</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A secured loan is backed by collateral. Collateral is an asset the lender may be able to claim if the 
            borrower defaults. For example, home loans (mortgages) are secured by real estate. If the borrower 
            defaults, the lender can foreclose on the property, meaning the lender can take ownership and sell it 
            to recover the loan amount. Auto loans are usually secured by the vehicle being financed. If the borrower 
            for an auto loan defaults, the lender can repossess the vehicle, meaning they can take back the vehicle 
            and sell it to recover the loan amount.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Secured loans often have lower interest rates because the lender has collateral to reduce risk. 
            Borrowers may find it easier to qualify for a secured loan compared to an unsecured loan of the same amount.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Assets used as collateral often need to be appraised prior to the loan being approved. This ensures the 
            lender knows the value of the asset can cover the loan amount if the borrower defaults. Due to the appraisal 
            process, secured loans often take longer to be approved compared to unsecured loans.
          </p>
          <br/>
          <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Unsecured Loans</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            An unsecured loan does not give the lender a direct claim on a specific asset. Credit cards, many 
            personal loans, and student loans are common examples. Because the lender takes more risk, 
            unsecured loans often carry higher rates.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Because unsecured loans carry more risk for the lender, they often have higher interest rates and 
            stricter qualification requirements compared to secured loans. Sometimes a <strong>co-signer</strong> is required to 
            help the borrower qualify for the loan. The co-signer essentially guarantees the loan, meaning they 
            promise to pay back the loan if the primary borrower defaults. This reduces the lender's risk. 
          </p>
      </div>

      <button
        onClick={() => onNavigate("kb-loan-basics-revolving-loans")}
        className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
      >
        Next: Revolving Loans
      </button>
    </section>
  );
}