import { ArrowLeft, CircleSlash2 } from "lucide-react";

interface DebtPaymentStrategiesKnowledgeBasePageProps {
	onNavigate: (page: string) => void;
}

export default function DebtPaymentStrategiesKnowledgeBasePage({ onNavigate }: DebtPaymentStrategiesKnowledgeBasePageProps) {
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
					Debt Payment Strategies
				</h1>
				<p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
					If you are carrying multiple debts, the method you use to pay them down can make a major
					difference in how quickly you become debt free. A clear plan helps you stay consistent,
					lower stress, and avoid costly mistakes.
				</p>
			</div>

			<div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
				<h2 className="text-xl font-bold text-slate-900 font-display">The Debt Snowball Method</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					The debt snowball method focuses on momentum. You list debts from smallest balance to
					largest balance, make minimum payments on all debts, and put any extra money toward the
					smallest balance first. Once the smallest debt is paid off, you roll that payment amount
					into the next debt.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					This method may not always save the most interest, but it can be extremely effective for
					motivation. Quick wins help you build confidence and stick to your plan longer.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Example snowball setup:
					<br/>
					<ul className="list-disc pl-5 space-y-1">
						<li>Small credit card: $600 balance.</li>
						<li>Medical bill: $1,800 balance.</li>
						<li>Car loan: $9,000 balance.</li>
						<li>You attack the $600 first, then apply that payment to the $1,800, then the car loan.</li>
					</ul>
				</p>
				<br/>
				<h2 className="mt-4 text-xl font-bold text-slate-900 font-display">The Debt Avalanche Method</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					The debt avalanche method is optimized to reduce total interest paid. You list debts by
					interest rate from highest to lowest, pay minimums on all accounts, and direct extra money
					to the highest-rate debt first.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					This approach often saves more money over time than snowball, especially when high-rate
					credit cards are involved. It requires patience because your first payoff might take longer,
					but mathematically it is frequently the lowest-cost strategy.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Example avalanche setup:
					<br/>
					<ul className="list-disc pl-5 space-y-1">
						<li>Card A: 29% APR, $1,200 balance.</li>
						<li>Card B: 18% APR, $2,000 balance.</li>
						<li>Personal loan: 9% APR, $5,000 balance.</li>
						<li>You prioritize Card A first because the interest rate is highest.</li>
					</ul>
				</p>
                <br/>
                <h2 className="mt-6 text-lg font-bold text-slate-900">Debt Consolidation Method</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Debt consolidation involves combining multiple debts into a single loan, often with a lower 
                    interest rate. This can simplify payments and potentially reduce interest costs, but it is 
                    important to consider fees and terms to ensure it is beneficial. Here is an example:
					<br/>
                    <ul className="list-disc pl-5 space-y-1">
						<li>Credit card A: 18% APR, $3,000 balance.</li>
						<li>Credit card B: 15% APR, $2,000 balance.</li>
						<li>Personal loan: 9% APR, $5,000 balance.</li>
						<li>You consolidate these debts into a new single loan with 10% APR, $10,000 balance.</li>
					</ul>
				</p>
                <br/>
				<h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Hybrid and Practical Strategies</h2>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Many people succeed with a hybrid approach. For example, you can pay off one small account
					first for motivation, then switch to avalanche to reduce interest costs. The best strategy is
					the one you can sustain month after month.
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					Helpful tactics that support either method:
					<br/>
					<ul className="list-disc pl-5 space-y-1">
						<li>Automate minimum payments to avoid late fees.</li>
						<li>Create a monthly debt line item in your budget.</li>
						<li>Use windfalls, bonuses, and tax refunds for principal reduction.</li>
						<li>Consider consolidation only if it lowers rate and fees.</li>
						<li>Pause new borrowing while in payoff mode.</li>
					</ul>
				</p>
				<p className="mt-2 text-sm leading-6 text-slate-600">
					If your income is irregular, it is smart to build a one-month emergency buffer first. A small 
                    cash cushion helps prevent new debt when unexpected costs appear.
				</p>
			</div>

			<button
				onClick={() => onNavigate("kb-managing-debt-default-bankruptcy")}
				className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
			>
				Next: Missed Payments, Default, and Bankruptcy
			</button>

		</section>
	);
}
