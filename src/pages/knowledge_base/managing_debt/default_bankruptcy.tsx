import { ArrowLeft, CircleSlash2 } from "lucide-react";

interface DefaultBankruptcyKnowledgeBasePageProps {
	onNavigate: (page: string) => void;
}

export default function DefaultBankruptcyKnowledgeBasePage({ onNavigate }: DefaultBankruptcyKnowledgeBasePageProps) {
	return (
		<section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
			<button
				onClick={() => onNavigate("kb-managing-debt")}
				className="inline-flex items-center gap-2 text-sm font-semibold text-accent-purple hover:underline"
			>
				<ArrowLeft className="h-4 w-4" /> Back to Managing Debt
			</button>

			<div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm space-y-5">
				<div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
					<CircleSlash2 className="h-3.5 w-3.5" /> Managing Debt Article
				</div>
				<h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 font-display">
					Missed Payments, Default, and Bankruptcy
				</h1>
				<p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
					Falling behind on debt can escalate quickly from missed payments to default and, in some
					cases, bankruptcy. Understanding each stage helps you act early, protect your options,
					and reduce long-term damage.
				</p>
			</div>

			<div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
				<h2 className="text-xl font-bold text-slate-900 font-display">Missed Payments and Delinquency</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					A missed payment usually triggers a late fee and can be reported to credit bureaus after the
					account is 30 days past due. Once payments are consistently late, the loan is considered
					delinquent. Delinquency can lower your credit score and make future borrowing more expensive.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Lenders may offer short-term hardship options if you contact them early. The earlier you ask,
					the more likely you are to get flexible terms such as a temporary payment reduction or due
					date adjustment.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Early warning signs to watch:
					<br/>
					<ul className="list-disc pl-5 space-y-1">
						<li>You are paying one bill late to cover another bill on time.</li>
						<li>You are relying on credit cards for essential monthly expenses.</li>
						<li>You are skipping minimum payments or only paying after reminders.</li>
					</ul>
				</p>
				<br/>
				<h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Loan Default and Collections</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Default happens when a borrower fails to repay according to the loan agreement for an extended
					period. The exact timeline depends on the loan type and lender, but default is more severe
					than a one-time late payment.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					In default, lenders may accelerate the balance, send the account to collections, pursue legal
					action, garnish wages where permitted, or repossess collateral for secured loans. Defaults can
					remain on credit reports for years.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Steps that can reduce harm before default:
					<br/>
					<ul className="list-disc pl-5 space-y-1">
						<li>Call the lender before the account becomes seriously past due.</li>
						<li>Ask about hardship plans, deferment, or forbearance options.</li>
						<li>Document all communication and keep copies of agreements.</li>
						<li>Prioritize secured debts and essential housing payments first.</li>
					</ul>
				</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Here are some resources with more information on mitigating the impact of loan defaults and 
                    managing the consequences:
                    <br/>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><a href="https://www.consumerfinance.gov/consumer-tools/debt-collection/" target="_blank" rel="noopener noreferrer" className="text-accent-purple">Consumer Financial Protection Bureau: Debt Collection</a></li>
                        <li><a href="https://studentaid.gov/articles/default/" target="_blank" rel="noopener noreferrer" className="text-accent-purple">Federal Student Aid Defaults</a></li>
                        <li><a href="https://finhelp.io/glossary/loan-default-remedies-what-lenders-can-and-cannot-do/" target="_blank" rel="noopener noreferrer" className="text-accent-purple">FinHelp: Loan Default Remedies</a></li>
                    </ul>
				</p>
				<br/>
				<h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Bankruptcy Basics and Management Tips</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Bankruptcy is a legal process designed to help people who cannot reasonably repay their debts.
					Depending on the type filed, some debts may be discharged while other debts are repaid through
					a court-approved plan. Bankruptcy can provide relief, but it also has lasting credit and legal
					consequences.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Bankruptcy is generally a last-resort tool after other strategies have failed. Before filing,
					people often review alternatives such as negotiated settlements, structured repayment plans,
					credit counseling, or temporary hardship programs.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Practical tips to manage severe debt stress:
					<br/>
					<ul className="list-disc pl-5 space-y-1">
						<li>Create a bare-bones budget and protect essentials first.</li>
						<li>Stop ignoring mail and calls from lenders or servicers.</li>
						<li>Seek advice from a nonprofit credit counselor or qualified attorney.</li>
						<li>Avoid scams promising instant debt elimination for upfront fees.</li>
						<li>Rebuild gradually with on-time payments and a cash emergency buffer.</li>
					</ul>
				</p>
				<br/>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Here are some resources for filing for bankruptcy:
                    <br/>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><a href="https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics" target="_blank" rel="noopener noreferrer" className="text-accent-purple">U.S. Courts: Bankruptcy Information</a></li>
                        <li><a href="https://www.nolo.com/legal-encyclopedia/bankruptcy" target="_blank" rel="noopener noreferrer" className="text-accent-purple">Nolo: Bankruptcy Guide</a></li>
                        <li><a href="https://upsolve.org/" target="_blank" rel="noopener noreferrer" className="text-accent-purple">Upsolve: Bankruptcy Assistance</a></li>
                    </ul>
                </p>
                <br/>
				<h2 className="mt-6 text-lg font-bold text-slate-900">The Bottom Line</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					<strong>Missed payments can become default, and default can become a legal crisis. Acting
					early, communicating clearly, and using credible support can preserve your options.</strong>
				</p>
			</div>

			<button
				onClick={() => onNavigate("kb-mortgages")}
				className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
			>
				Next: Mortgages
			</button>

		</section>
	);
}
