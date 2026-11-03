import { ArrowLeft, GraduationCap } from "lucide-react";

interface StudentLoansKnowledgeBasePageProps {
  onNavigate: (page: string) => void;
}

export default function StudentLoansKnowledgeBasePage({ onNavigate }: StudentLoansKnowledgeBasePageProps) {
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
          <GraduationCap className="h-3.5 w-3.5" /> Student Loans
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-display">Student Loans</h1>
        <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
          Student loans are used to finance education costs such as tuition, housing, books, and fees. Loan type,
          interest terms, and repayment structure can significantly affect affordability during and after school.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">Section Contents</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 list-disc pl-5">
          <li>
            Student Loans (this page)
          </li>
          {/* <li>
            <button
              onClick={() => {}}
              className="text-accent-purple hover:underline"
            >
              Placeholder Topic 1
            </button>
          </li>
          <li>
            <button
              onClick={() => {}}
              className="text-accent-purple hover:underline"
            >
              Placeholder Topic 2
            </button>
          </li> */}
        </ul>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">How Student Loans Work</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Student loans are funds borrowed only for educational expenses (tuition, books, room and board, computers, 
          and other necessary educational costs). Borrowers receive loan disbursements through
          the school or lender, and repayment typically begins after a grace period following graduation or
          reduced enrollment.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Federal and private student loans can differ in rates, protections, and repayment flexibility. Federal
          programs often include deferment, forbearance, and income-based options, while private loans depend on
          lender-specific terms and underwriting.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Interest may accrue while in school depending on loan type. Borrowers who understand accrual, capitalize
          less interest, and plan payments early can lower total repayment cost over the life of the loan.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Student Loan Planning</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Borrowing should align with expected post-graduation income and career plans. Comparing projected monthly
          payments against likely starting salary helps students avoid overborrowing and reduce repayment stress.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Keeping track of principal, rate, and servicer details is important. Good record keeping helps borrowers
          choose repayment plans strategically and stay current once repayment begins.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Federal Student Loans</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Federal student loans are funded by the U.S. government and typically offer fixed interest rates, 
          flexible repayment options, and borrower protections such as deferment, forbearance, and income-driven 
          repayment plans. These loans are generally more favorable for students due to their stability and support 
          features. Federal student loans can either be <strong>subsidized</strong>, where the government pays the 
          interest, or <strong>unsubsidized</strong>, where the borrower pays the interest. Subsidized loans are 
          only available for undergraduates. 
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Visit StudentAid.gov for more information on federal student loans: <a href="https://studentaid.gov/understand-aid/types/loans" className="text-accent-purple underline">StudentAid.gov: Federal Student Loans</a>.
        </p>
      </div>

      <button
        onClick={() => onNavigate("kb")}
        className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
      >
        Back to Knowledge Base
      </button>
    </section>
  );
}
