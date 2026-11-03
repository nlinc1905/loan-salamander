import { ArrowLeft, CircleSlash2 } from "lucide-react";

interface GoodBadDebtKnowledgeBasePageProps {
	onNavigate: (page: string) => void;
}

export default function GoodBadDebtKnowledgeBasePage({ onNavigate }: GoodBadDebtKnowledgeBasePageProps) {
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
					Good vs Bad Debt
				</h1>
				<p className="max-w-3xl text-sm sm:text-base leading-7 text-slate-600">
                    Common financial advice is that debt should be treated differently depending on what the debt 
                    is used for. While every situation is unique, understanding the distinction between what is 
                    commonly considered good or bad debt helps you make informed borrowing decisions.
				</p>
			</div>

			<div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
				<h2 className="text-xl font-bold text-slate-900 font-display">Good Debt</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Good debt is typically considered an investment in your future that can increase your net worth 
                    or improve your financial situation over time. Examples include student loans for education, 
                    mortgages for a home, or business loans that help generate income. Good debt usually has 
                    favorable terms, such as lower interest rates, and is used for purposes that can provide 
                    long-term benefits.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    It is important to recognize that even if a debt is considered "good" it can still be a 
                    poor decision to take on the debt if the terms are unfavorable, risk is not considered, 
                    or if it does not complement your overall financial strategy. The key is to evaluate the 
                    loan to ensure it makes sense. Treat your personal finances like a business. 
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Examples of good debt:
                    <br/>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Alice takes out a student loan to pay for her college education. Her degree is in a 
                            field with high demand for jobs, most of which require a college degree to qualify 
                            for. She pursues scholarships to reduce the amount she needs to borrow, and calculates 
                            her monthly payments to ensure she will be able to pay them at an entry level salary 
                            upon graduation.
                        </li>
                        <li>Bob takes out a mortgage to buy a home in an area where home values are expected to 
                            appreciate over time. He shops around for a lender with the best 
                            interest rate and decides on a fixed rate because rates are expected to rise in the 
                            next few years. He plans to stay in the home for several years to build equity, 
                            and he calculates the monthly payments to ensure they fit within his budget. 
                        </li>
                        <li>Claudia takes out a small business loan to expand her bakery. She has a solid 
                            business plan that projects increased revenue from the expansion. She ensures the 
                            loan amount is manageable and that the expected increase in income will cover the 
                            loan payments, making it a strategic investment in her business's growth.
                        </li>
                    </ul>
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Examples of good debt that is poorly managed:
                    <br/>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>David does not know how he will use a college degree, but it is what everybody seems 
                            to be doing, so he enrolls in a popular out of state school with higher tuition costs. 
                            He does not get any scholarships and ignores the expected monthly payment because he 
                            assumes his future self will take care of it somehow. Upon graduation, his entry level 
                            job does not pay enough to cover the loan payments with all his other living expenses.
                        </li>
                        <li>Emma falls in love with a gigantic house in an upscale neighborhood. She does not have 
                            much for a down payment, but she determines she can handle the monthly payments if she 
                            lives frugally. However, as she begins hanging paintings on the walls of her new house, 
                            she accidentally drills into a water pipe. Soon after, her car breaks down. With the 
                            unplanned expenses, she faces financial strain and struggles to keep up with her 
                            mortgage payments.
                        </li>
                        <li>Frank's business is growing leaps and bounds, and he projects his customer base will 
                            continue growing exponentially over the next few years. He applies for a large business 
                            loan to fund an expansion. After a year, actual growth fell short of his projections, 
                            and his large monthly payments diminish his profit margins. When 
                            it comes time for payroll, he realizes he will not be able to cover the costs, 
                            putting his business in a difficult position.
                        </li>
                    </ul>
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    These examples illustrate how good debt can work to your advantage when properly managed, but 
                    cause financial difficulties when expectations do not meet reality or when unforeseen events 
                    occur. Bad luck can happen to anyone, so it is important to consider potential risks before 
                    taking on debt.
                </p>
                <br/>
                <h2 className="mt-4 text-xl font-bold text-slate-900 font-display">Bad Debt</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Bad debt typically refers to borrowing for things that do not appreciate in value or generate 
                    income, such as credit card debt for consumables or personal loans for non-essential items. 
                    Bad debt often comes with higher interest rates and less favorable terms, making it more 
                    costly over time and potentially harmful to your financial situation if not managed carefully.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Just like how good debt can be deterimental if not properly managed, bad debt can be beneficial 
                    if it is properly managed. Even if a debt is considered "bad" it can still be a 
                    good decision to take on the debt if the terms are favorable, risk is fully considered, 
                    and if it complements your overall financial strategy. The key is to evaluate the 
                    loan to ensure it makes sense. Treat your personal finances like a business. 
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Examples of bad debt:
                    <br/>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Gabriella opens a new credit card with an airline that rewards points she wants to use 
                            for travel. She puts several large purchases on the card to earn points, forgetting 
                            about the high interest rate. When she realizes the minimum monthly payment is higher 
                            than her income can sustain, she faces problems.
                        </li>
                        <li>Henry takes out a personal loan to buy a luxury watch. The loan has a high interest 
                            rate, and the watch does not appreciate in value. Over time, the interest payments 
                            add up, making the purchase much more expensive than anticipated. He realizes that 
                            the money he paid in interest could have been invested and built him a comfortable 
                            portfolio.
                        </li>
                        <li>Imogen gets paid next Friday, but her rent is due today and she does not have enough 
                            money to cover it. She takes a payday loan with a very high interest rate to cover 
                            her rent. After her living expenses are deducted from her paycheck, she realizes she 
                            will need to renew the payday loan to cover the rest of the month. Meanwhile the 
                            interest on the loan keeps growing, trapping her in a cycle of debt that is difficult 
                            to escape.
                        </li>
                    </ul>
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Examples of bad debt that is properly managed:
                    <br/>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>John opens a credit card to use for everyday expenses. He keeps a budget and pays 
                            off the entire balance every month to avoid interest. He uses this credit card to 
                            build his credit history and improve his credit score.
                        </li>
                        <li>Kayla has several high interest credit cards. She takes out a personal loan with an 
                            interest rate lower than her credit cards. She uses the personal loan to consolidate 
                            her credit card debt to a single payment, reduce her overall interest, and 
                            more easily pay down her debt over time.
                        </li>
                        <li>Liam discovers his new landlord will only accept cash for his first month's payment. His 
                            moving truck is sitting outside, and he needs the money now. It is too much to withdraw 
                            from an ATM and he does not have a credit card to get a cash advance. So he takes a 
                            payday loan to cover the rent, and immediately writes a check to pay off the loan.
                        </li>
                    </ul>
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    These examples illustrate how bad debt can work to your advantage when properly managed, 
                    or cause great distress when it is not.
                </p>
                <br/>
                <h2 className="mt-6 text-lg font-bold text-slate-900">The Bottom Line</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    <strong>All loans are tools. There is a tool for every purpose, and each tool has a 
                    right way and a wrong way to use it.</strong>
                </p>
            </div>

            <button
                onClick={() => onNavigate("kb-managing-debt-payment-strategies")}
                className="mt-6 px-4 py-2 bg-accent-purple text-white rounded hover:bg-accent-lavender"
            >
                Next: Debt Payment Strategies
            </button>

        </section>
	);
}
