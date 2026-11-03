import { ArrowLeft, Landmark } from "lucide-react";

interface MortgagesKnowledgeBasePageProps {
  onNavigate: (page: string) => void;
}

export default function MortgagesKnowledgeBasePage({ onNavigate }: MortgagesKnowledgeBasePageProps) {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <button
        onClick={() => onNavigate("kb")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-accent-purple hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to knowledge base
      </button>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-purple/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-purple">
          <Landmark className="h-3.5 w-3.5" /> Mortgages
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display">Mortgages</h1>
        <p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
          A mortgage is a loan secured by real estate. Mortgage decisions involve more than the rate alone: down payment size, term length,
          closing costs, escrow, and future plans all affect the right choice.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">Section Contents</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600 list-disc pl-5">
          <li>
            Mortgages (this page)
          </li>
          <li>
            <button
              onClick={() => onNavigate("kb-mortgages-mortgage-terms")}
              className="text-accent-purple hover:underline"
            >
              Mortgage Loan Terms
            </button>
          </li>
          <li>
            <button
              onClick={() => onNavigate("kb-mortgages-property-assets")}
              className="text-accent-purple hover:underline"
            >
              Using Property as a Financial Asset
            </button>
          </li>
        </ul>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
        <h2 className="text-xl font-bold text-slate-900 font-display">Mortgage Basics</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          A mortgage is a loan secured by real estate and used to purchase real estate, typically a home. 
          Due to the high cost of real estate, most people cannot afford to pay the full price upfront, so 
          mortgage loans allow borrowers to spread the cost of the property over time, making homeownership 
          more accessible. 
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Mortgages typically involve regular payments over a set period, often 15 to 30 years, and include both 
          principal and interest. The interest rate can be fixed or variable, affecting the total cost of the loan 
          over time. Mortgage interest rates are benchmarked on U.S. Treasury yields, because they reflect the cost 
          of borrowing money in the broader financial market. The 10-year yield is a common benchmark because many 
          borrowers only stay in their homes for under 10 years, regardless of mortgage term. For more information 
          on how interest rates are set, see the <a href="/?page=kb-loan-basics-fixed-variable-interest" className="text-accent-purple hover:underline">Fixed vs Variable Interest Rates</a> page.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The process of obtaining a mortgage involves several steps, including pre-qualification, pre-approval, 
          loan application, underwriting, and closing. Each step has its own requirements and documentation, 
          and understanding the process can help borrowers navigate the mortgage journey more effectively. 
          The final step is called <strong>closing</strong>, where the borrower signs the necessary documents, 
          pays any closing costs, and the ownership of the property is officially transferred from the seller to 
          the buyer.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Lenders, Brokers, and Loan Servicers</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          <strong>Mortgage lenders</strong> are banks or other financial institutions that provide the funds 
          for the borrower to purchase the property. <strong>Mortgage brokers</strong> are businesses that act as 
          intermediaries to connect borrowers with lenders. Brokers typically do not provide the funds to purchase 
          the property themselves, nor do they service the loan. <strong>Loan servicers</strong> manage the 
          day-to-day administration of the mortgage, including collecting payments and handling customer service. 
          Loan servicers can be the original lender or a third-party company. 
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Mortgage Pre-Qualification and Pre-Approval</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          One of the first steps in the process of buying a home is securing financing. <strong>Pre-qualification</strong> is 
          a preliminary step where the lender evaluates the borrower's financial situation to estimate how much 
          they might be able to borrow. It is an informal estimate based on self-reported information like income, 
          debt, and assets. A soft credit check is often included. Since pre-qualification is not verified, it holds 
          little weight with sellers or real estate agents, and is mainly used as a first step to vet a borrowers's 
          ability to obtain a mortgage.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Pre-qualification is carried out by a lender or broker, but you can get an idea of how much you could afford 
          to borrow by entering the information yourself in <a href="/?page=scenarios" className="text-accent-purple hover:underline">the variable scenarios calculator</a>. 
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          <strong>Pre-approval</strong> is a more formal process where the lender or broker verifies the borrower's financial 
          information and provides a conditional commitment for a specific loan amount. This involves a hard credit 
          inquiry, verification of income, and assessment of assets and debts to determine the borrower's ability 
          to repay the loan. Pre-approval sets the loan terms, like the interest rate, loan amount, escrow estimate, 
          tax estimate, and other conditions, giving the borrower a clearer picture of their financing before making 
          an offer on a property. A pre-approval letter signals to sellers and real estate agents that the buyer is serious 
          about making a purchase and has the ability to secure financing, which can make any offers to purchase 
          more attractive to sellers. However, pre-approval does not guarantee that a loan will be approved.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          As a borrower, you are usually assigned a <strong>loan officer</strong> (also known as a mortgage loan originator) during the pre-approval process who will act 
          as your primary contact throughout <strong>loan origination</strong> (the name of the process of 
          initiating, processing, and funding a loan from initial application to final closing). The loan officer will 
          coordinate with a <strong>loan underwriter</strong>, who evaluates the borrower's financial information, 
          creditworthiness, and the risk associated with the loan to determine whether the loan should be approved. 
          The underwriter is the person responsible for making the final decision on mortgage approval. Pre-approval 
          does not guarantee the underwriter will approve the loan. In your closing documents, you will likely see 
          a <strong>loan origination fee</strong>, which is a fee charged by the lender for the administrative 
          costs of processing and underwriting the loan. 
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Underwriting</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          A <strong>mortgage lender</strong> is an entity that provides the funds for a borrower to purchase a 
          property. They evaluate the borrower's financial situation, credit history, and the value of the 
          property to determine the terms of the mortgage, including the interest rate and repayment schedule. They 
          do this through a process called <strong>underwriting</strong>. During underwriting, the lender's 
          underwriter assesses the risk of lending to the borrower by considering the borrower's financial situation, 
          credit history, and the value of the property to determine whether the loan should be approved and 
          under what terms. This step protects the lender.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          It is important that the borrower does not take on any new debt or make significant financial changes 
          during the underwriting process, like buying a car with an auto loan, as it could affect the lender's 
          assessment and jeopardize mortgage approval.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Escrow</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          An <strong>escrow account</strong> is a financial account held by the lender into which the borrower 
          deposits funds for property taxes, homeowners insurance, and sometimes other expenses. The lender then 
          uses the funds in the escrow account to pay these obligations on behalf of the borrower, ensuring that 
          the property remains insured and taxes are paid on time. This protects both the borrower and the lender. 
          The fees included in escrow are listed on the closing disclosure. 
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Escrow accounts total the cost of property taxes, homeowners insurance, and miscellaneous other expenses 
          as required by the loan agreement, then divide that by 12 to get the amount paid each month. This amount is 
          added to the monthly mortgage payment, however these fees are not part of the loan principal so they do not 
          get factored into the interest cost of the loan. 
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          As a borrower, if you have an escrow with your mortgage, you will receive property tax bills and insurance 
          premium bills in the mail, but you should not pay these directly. Instead, send them to your loan servicer 
          and they will use the information to calculate the escrow for the year. This can mean your monthly payments, 
          even for fix rate loans, can vary slightly from year to year. It is also important to share updates to 
          home insurance with your loan servicer, so they can update the escrow. For example, if you find a cheaper 
          home insurer and switch policies, you should inform your loan servicer.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Closing</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Closing is the final step in the mortgage process where the borrower and lender complete the transaction. 
          By this point, the buyer's loan has been underwritten and approved, and all conditions for closing have 
          been met. During closing, the buyer/borrower signs the mortgage documents, pays any closing costs, and 
          the lender disburses the loan funds, usually via a wire transfer. The seller receives the payment for 
          the property, minus any closing costs, completing the transaction. The property title is transferred to 
          the buyer, and the mortgage becomes effective.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          An example closing disclosure can be found here: <a href="https://www.consumerfinance.gov/compliance/compliance-resources/mortgage-resources/tila-respa-integrated-disclosures/forms-samples/#closing-disclosure-sample" className="text-accent-purple hover:underline" target="_blank" rel="noopener noreferrer">Closing Disclosure Sample</a>. 
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Repayment</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          After closing, the mortgage enters the repayment stage. Repayment follows an amortization schedule, which 
          you can find in this app: <a href="/?page=calculator" className="text-accent-purple hover:underline" target="_blank" rel="noopener noreferrer">Amortization Schedule</a>. 
          Repayment of a mortgage occurs through regular monthly payments that include both principal and interest. 
          These payments gradually reduce the principal balance while covering the interest owed on the loan. 
          Over time, the portion of the payment that goes toward the principal increases, while the interest 
          portion decreases, following the amortization schedule. At the end of the loan term, the mortgage is fully 
          repaid, and the borrower owns the property outright.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          If the borrower sells the property before the end of the loan term, the outstanding mortgage balance 
          must be paid off from the proceeds of the sale. Any remaining funds after satisfying the mortgage would 
          go to the borrower. This ensures that the lender is repaid even if the property changes ownership before 
          the loan term ends.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Collateral and Foreclosure</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Like any secured loan, the collateral can be seized by the lender if the borrower fails to make payments. 
          In the case of a mortgage, that means the lender can take possession of (foreclose on) the property if 
          the borrower fails to make the required payments. If the borrower becomes bankrupt, the mortgage holder 
          has the foremost legal claim to the property, meaning they are the first to be paid from the proceeds 
          if the property is sold during bankruptcy. Any other creditors seeking debt repayment from the borrower 
          would be paid only after the mortgage holder has been satisfied. 
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Mortgage Insurance</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Lenders require borrowers to obtain <strong>mortgage insurance</strong> or <strong>PMI (Private Mortgage Insurance)</strong> to protect the lender 
          in case the borrower defaults on the loan. This is common for borrowers who make a down payment of less 
          than 20% of the property's value. Mortgage insurance can be paid as a monthly premium or as a one-time 
          upfront fee, depending on the terms of the loan. Mortgage insurance increases the monthly payment, thereby 
          increasing the total cost of the loan, without contributing to the borrower's equity in the property.
        </p>           
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Despite being paid by the borrower and having the name "insurance", mortgage insurance protects the lender, 
          not the borrower. It ensures that if the borrower defaults, the lender can recover some or all of the 
          outstanding loan amount. Borrowers should understand that this insurance does not protect them from 
          losing their home if they fail to make payments.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          A common question is why borrowers have to pay mortgage insurance if the loans interest rate is supposed to 
          already account for lending risk. The answer lies in secondary markets, where loans are sold to investors. 
          While the interest rate covers the general risk of lending and compensation for the time value of money for 
          the lender, it does not cover the cost of loss if the borrower defaults, particularly when the down payment 
          is small. So entities that buy these loans in the secondary market require additional protection to 
          mitigate the risk of loss, which gets passed to the borrower in as the PMI.
        </p>
        <br/>
        <h2 className="text-xl font-bold text-slate-900 font-display">Securitization and Secondary Markets</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Securitization refers to the process by which individual mortgage loans are bundled together and sold as 
          <strong>mortgage-backed securities (MBS)</strong> to investors. The government-sponsored entities <a href="https://www.fhfa.gov/about-fannie-mae-freddie-mac" className="text-accent-purple hover:underline" target="_blank" rel="noopener noreferrer">Fannie Mae 
          and Freddie Mac</a>  facilitate this process by bundling and selling the MBS. This process allows lenders 
          free up capital to issue more loans, while transferring the risk of borrower default to the investors 
          who purchase the securities. The secondary market for mortgages plays a crucial role in providing liquidity to the 
          housing finance system, enabling lenders to continue offering mortgage products to homebuyers.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Investors in mortgage-backed securities receive payments derived from the underlying mortgage loans, 
          which include both principal and interest. The performance of these securities depends on the repayment 
          behavior of the borrowers. This structure allows the risk of individual mortgage defaults to be spread 
          across many investors, reducing the impact on any single entity and supporting the overall stability 
          of the housing finance system.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          For borrowers, this means that while the terms of their mortgage remain consistent, the entity they 
          interact with for payments and customer service may change over time. 
        </p>
      </div>

    <button
      onClick={() => onNavigate("kb-mortgages-mortgage-terms")}
      className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
    >
      Next: Mortgage Loan Terms
    </button>

    </section>
  );
}
