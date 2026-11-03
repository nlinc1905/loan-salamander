import { ArrowLeft, CircleDollarSign } from "lucide-react";

interface FixedVariableInterestKnowledgeBasePageProps {
	onNavigate: (page: string) => void;
}

export default function FixedVariableInterestKnowledgeBasePage({ onNavigate }: FixedVariableInterestKnowledgeBasePageProps) {
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
					Fixed vs Variable Interest Rates
				</h1>
				<p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
					The interest rate on a loan determines part of your borrowing cost. A <strong>fixed</strong> rate 
                    stays the same over the entire loan period, whereas a <strong>variable</strong> rate can 
                    change over time. For borrowers, the choice between fixed and variable rates involves 
                    balancing predictability with potential cost savings.
				</p>
			</div>

			<div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
				<h2 className="text-xl font-bold text-slate-900 font-display">Fixed Interest Rates</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        A fixed rate stays the same throughout the loan. That means the interest portion of your 
                        payment is predictable, resulting in a consistent monthly payment that can make budgeting 
                        easier. Since the rate is unaffected by market conditions, a fixed rate is beneficial in times 
                        when rates are rising, as it protects borrowers from increasing interest costs over time. 
                        On the other hand, when rates are falling, a fixed rate may result in higher interest costs 
                        compared to a variable rate.
                    </p>
                    <br/>
                    <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Variable Interest Rates</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        A variable rate can move up or down based on market conditions or the lender's formula. 
                        That means the interest portion of your payment can vary over time, resulting in a 
                        variable monthly payment that can make budgeting more challenging. The rate is determined 
                        by market conditions. Variable rate loans are often set up to be fixed for certain time 
                        periods and are allowed to change at pre-determined intervals. For example, a common pattern 
                        is to have a fixed initial rate for a few years, followed by a change in the rate every 1 year 
                        after that for the duration of the loan.
                    </p>
                    <br/>
                    <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">How Interest Rates are Set</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Interest rates are influenced by a variety of factors, including central bank policies, 
                        market conditions, and the lender's assessment of a borrower's risk of default. These factors 
                        stack on one another, starting from the central bank's policies.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        In the United States, interest rates are influenced by the <strong>Federal Reserve</strong>, 
                        which is the central bank. The Federal Reserve, or the Fed, sets a target range for the 
                        interest rate called the <strong>federal funds rate</strong>. The federal funds rate is the 
                        rate at which banks lend to each other overnight. Banks lend to each other overnight because 
                        at the end of each day, after depositors (people who store money in the bank) have made 
                        withdrawals, some banks may have shortfalls due to more withdrawals than deposits, while 
                        other banks may have excess reserves due to more deposits than withdrawals. Federal law 
                        requires banks to maintain a certain level of reserves at the end of each day. So to meet 
                        the reserve requirement, banks with excess reserves lend the excess to banks that 
                        have shortfalls. The banks with shortfalls pay interest to the banks that lend to them. 
                        You can read more about how this rate is set here: <a href="https://fred.stlouisfed.org/series/FEDFUNDS" className="text-accent-purple hover:underline" target="_blank" rel="noopener noreferrer">https://fred.stlouisfed.org/series/FEDFUNDS</a>.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        When the federal funds rate is high, it discourages banks to lend to each other 
                        because borrowing is more expensive. This tends to lead to higher interest rates for 
                        consumers and businesses, which can slow down economic activity. Conversely, when the 
                        federal funds rate is low, it encourages more lending between banks, which can lead to 
                        lower interest rates for consumers and businesses, stimulating economic activity. This 
                        is how the Fed influences the rates you pay on loans.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        The federal funds rate applies to banks, and lenders do not loan at the federal funds rate 
                        to consumers or businesses. Instead, they add more interest on top of the federal funds rate 
                        to cover their own costs, risk, and profit margin. The added interest is often around 3% higher 
                        than the federal funds rate, and it is called the <strong>prime rate</strong>. The prime rate 
                        is what lenders charge their most trustworthy (institutional) customers who are expected to 
                        have the lowest risk of default. Higher risk customers get more interest tacked on to the 
                        prime rate, where the additional interest is proportional to the perceived risk of default. 
                        Most consumers and businesses get rates that are higher than the prime rate.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        For consumers, risk of default is often determined by their <strong>credit score</strong>, which 
                        is a score that summarizes their creditworthiness 
                        based on their credit history, payment behavior, and outstanding debts. People with higher 
                        credit scores can get loans at lower interest rates, closer to the prime rate. People with 
                        lower credit scores are usually offered loans at higher interest rates, ultimately having 
                        to pay more for borrowing money.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Since the prime rate is based on the federal funds rate, it is a short-term rate, because 
                        it can change quickly. Some loans, like mortgages, are considered <strong>long-term loans</strong>, so their 
                        rates are not determine by the prime rate, but instead by a long-term benchmark. The most 
                        common long-term benchmarks are 10-year and 30-year Treasury yields (10-year is used because 
                        many borrowers sell or refinance within 7 to 10 years). <strong>Treasury yields</strong> are 
                        the returns on U.S. government debt securities (bonds that promise to pay interest over 
                        a fixed period and return the principal at maturity), and they reflect market expectations 
                        for interest rates, inflation, and economic growth over the long term. The reason they are 
                        used as benchmarks for long-term loans is that they provide a market-based measure of the 
                        cost of borrowing over a similar time horizon, as treasuries and mortgages compete for the 
                        same investors.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Long-term loans have their own markup, called the <strong>spread</strong>. Instead of a flat 
                        percentage over the prime rate, long-term loans typically have a 2% markup over the Treasury 
                        yield. For example, if the 10-year Treasury yield is 3%, a fixed-rate mortgage for excellent 
                        credit borrowers may have a 2% spread, resulting in an interest rate of 5%.
                    </p>
                    <br/>
                    <h2 className="text-xl font-bold text-slate-900 font-display">Choosing Between Fixed and Variable Rates</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        When deciding between fixed and variable rates, borrowers need to consider their expectations 
                        for future interest rates, their risk tolerance, and their financial situation. When 
                        interest rates are expected to rise, borrowers should prefer fixed rates to lock in a 
                        lower rate now and avoid higher payments in the future. Conversely, when interest rates are 
                        expected to fall, borrowers might prefer variable rates to benefit from lower future payments. 
                        Alternatively, long-term borrowers could choose a fixed rate for the short-term, and plan to 
                        refinance to take advantage of lower rates in the future. This is a common strategy for home 
                        purchases. It is also possible to refinance variable rate loans to fixed rate, and vice versa, 
                        if the lender allows it, but whether it makes financial sense depends on <a href="https://www.nerdwallet.com/ca/p/article/mortgages/switch-to-fixed-rate-mortgage">many factors</a>.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Variable rate loans often start lower than fixed rate loans because lenders are taking 
                        on the risk that interest rates may rise in the future. By starting with a lower initial 
                        rate, borrowers benefit from lower initial payments, while the lender compensates for the 
                        potential future rate increases. Since variable rate loans make assumpations about future 
                        interest rates, it helps to model possible scenarios. Three common scenarios are the <strong>best case</strong> where 
                        interest rates fall throughout the loan term, the <strong>worst case</strong> where 
                        interest rates rise throughout the loan term, and the <strong>average case</strong> where 
                        interest rates both rise and fall over the loan term. 
                        You can also run <strong>Monte-Carlo simulations</strong>, to test many possible interest 
                        rate paths to estimate the full distribution of possibilities. Most lenders provide the worst 
                        case scenario estimates to help borrowers understand their maximum risk. You can use Loan 
                        Salamander's <a className="text-accent-purple hover:underline" href="/?page=scenarios">variable scenarios</a> tool to model variable 
                        rate loans.
                    </p>
            </div>

            <button
                onClick={() => onNavigate("kb-loan-basics-secured-unsecured")}
                className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
            >
                Next: Secured vs Unsecured Loans
            </button>

        </section>
	);
}
