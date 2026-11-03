import { ArrowLeft, CircleDollarSign } from "lucide-react";

interface CreditScoreKnowledgeBasePageProps {
	onNavigate: (page: string) => void;
}

export default function CreditScoreKnowledgeBasePage({ onNavigate }: CreditScoreKnowledgeBasePageProps) {
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
					Credit Score
				</h1>
				<p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
					A credit score is a measure of how creditworthy a borrower appears to lenders. It affects 
                    whether you qualify for loans, what interest rates you are offered, and sometimes how much 
                    you can borrow.
				</p>
			</div>

			<div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
				<h2 className="mt-4 text-xl font-bold text-slate-900 font-display">How Lenders Use Credit Scores</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Lenders use credit scores to estimate the probability that a borrower will repay on time. 
                    A stronger score usually signals higher creditworthiness and lower perceived risk of default, 
					which can help a borrower qualify for better terms. A lower score often leads to higher 
                    interest rates, stricter conditions, or denial of a loan qualification.
				</p>
				<br/>
				<h2 className="mt-4 text-xl font-bold text-slate-900 font-display">How a Credit Score is Calculated</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
                    A credit score can range from 300 to 850. There are different scoring methods, such as FICO 
                    and VantageScore, with the FICO score being the one most commonly used for lending decisions. 
                    A <a href="https://www.consumerfinance.gov/ask-cfpb/what-is-a-fico-score-en-1883/" className="text-accent-purple hover:underline" target="_blank" rel="noopener noreferrer">FICO credit score</a> is determined by:
                    <br/>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Payment history (35%): Are your past payments on time and consistent?</li>
                        <li>Outstanding balances (30%): What percentage of your total credit limit are you using?</li>
                        <li>Account age (15%): How old is your newest account, oldest account, and average account age?</li>
                        <li>Mix of account types (10%): What types of accounts do you have, such as credit cards, mortgages, and installment loans?</li>
                        <li>New credit inquiries (10%): Do you have any recent credit inquiries or new accounts?</li>
                    </ul>
                    <br/>
					VantageScore uses similar categories with different weights. Regardless of the methodology, 
                    credit scores are shaped by patterns in your credit history, with payment history usually being 
                    one of the biggest factors, because lenders want to know whether you consistently pay 
                    obligations on time.
				</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Looking at how your credit score is calculated will help you understand how different actions 
                    impact your credit score. For example, it may seem 
                    like closing a credit card is a responsible action. However, closing the account 
                    can reduce your total available credit and increase your credit utilization ratio, which 
                    would reduce your credit score. Here are a few other actions that can impact your credit score:
                    <br/>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Making late payments: Late or missed payments can significantly lower your score.</li>
                        <li>Opening new credit accounts: Each new account can temporarily lower your score due to the hard inquiry. However, if the new account increases your total available credit, the impact of the inquiry will fall off after a short period, and your score can increase due to lower utilization.</li>
                        <li>Maxing out credit cards: High credit utilization can negatively affect your score.</li>
                        <li>Closing credit accounts: Closing an account can reduce your total available credit and increase your credit utilization ratio, which can lower your score.</li>
                        <li>Paying down debt: Reducing your overall debt can improve your credit utilization ratio and positively impact your score.</li>
                        <li>Maintaining a long credit history: Keeping older accounts open, even if you no longer plan to use them, can help your score by contributing to a longer average credit history.</li>
                        <li>Mixing credit types: Having a mix of credit types, such as credit cards, installment loans, and mortgages, can positively impact your score by showing you can manage different types of credit responsibly.</li>
                        <li>Defaulting on a loan: Failing to repay a loan as agreed can severely damage your credit score and remain on your credit report for several years.</li>
                        <li>Filing for bankruptcy: Filing for bankruptcy can have a severe and long-lasting negative impact on your credit score, remaining on your credit report for up to 10 years depending on the type of bankruptcy.</li>
                        <li>Ignoring small debts: Anything that goes to collections, even small amounts, can negatively impact your credit score and remain on your credit report for several years.</li>
                    </ul>
                    <br/>
                    As you can see, there are many more ways to hurt your credit score than improve it. 
                </p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
                    While a credit score impacts your ability to get a loan, it is not the only factor.
					Above all, lenders want reliable, consistent revenue from borrowers' interest. Lending decisions 
                    are less about your ability to pay the amount you are borrowing and more about your ability to make 
                    consistent payments. For example, you may have $1 million in a savings account, but be unemployed. 
                    If you try to get a loan for $10,000, you can be denied even though you could easily pay 
                    the balance of the loan several times over, because the lender sees no income to support your 
                    ability to make consistent payments. 
				</p>
				<br/>
				<h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Why Credit Scores Matter for Loans</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					A stronger credit score can lower the cost of borrowing. Since interest rates are partly based 
                    on perceived default risk, a borrower with a stronger profile may pay less interest over the 
                    life of the loan. That difference can be substantial on large loans and long-term loans, like 
                    mortgages.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Credit scores can also affect access to certain loan products. Some lenders reserve their 
                    best offers for borrowers who meet a minimum score threshold, while others may require 
                    collateral or co-signers when credit is weaker. Most of the time, advertised interest rates 
                    used for loan products assume excellent credit, and many borrowers would not actually 
                    get the advertised rate.
				</p>
				<br/>
				<h2 className="text-xl font-bold text-slate-900 font-display">Improving and Protecting Your Score</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					The most practical ways to support a credit score are paying on time, avoiding persistent high 
                    utilization on revolving credit, and maintaining older accounts responsibly.
					Improvement usually happens gradually rather than instantly.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Borrowers should also review their credit reports periodically for errors or suspicious activity. 
                    Since credit scores influence borrowing costs,
					even a small reporting mistake can matter when applying for a loan. You can check your credit score 
                    by requesting a credit report from one of the three major credit bureaus: Equifax, Experian, or TransUnion. 
                    You are entitled to one free credit report from each of the three major credit bureaus every 12 months, which you can request at <a href="https://www.annualcreditreport.com" className="text-accent-purple hover:underline" target="_blank" rel="noopener noreferrer">AnnualCreditReport.com</a>. 
                    Be aware that many businesses advertise paid credit score services, but federal law mandates that you are entitled to a free credit report from each of the three major credit bureaus every 12 months.
				</p>
			</div>

			<button
				onClick={() => onNavigate("kb-managing-debt")}
				className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
			>
				Next: Managing Debt
			</button>

		</section>
	);
}
