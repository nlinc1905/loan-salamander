import { useEffect, useState } from "react";
import FrontPage from "./components/OverviewPage";
import CalculatorPage from "./components/CalculatorPage";
import VariableScenariosPage from "./components/VariableScenariosPage";
import PaymentScenariosPage from "./components/PaymentScenariosPage";
import RefinancePage from "./components/RefinancePage";
import CompareLoansPage from "./components/CompareLoansPage";
import ProfilePage from "./components/ProfilePage";
import KnowledgeBaseMainPage from "./pages/knowledge_base/main";
import LoanBasicsKnowledgeBasePage from "./pages/knowledge_base/loan_basics/main";
import FixedVariableInterestKnowledgeBasePage from "./pages/knowledge_base/loan_basics/fixed_variable_interest";
import SecuredUnsecuredKnowledgeBasePage from "./pages/knowledge_base/loan_basics/secured_unsecured";
import RevolvingLoansKnowledgeBasePage from "./pages/knowledge_base/loan_basics/revolving_loans";
import CreditScoreKnowledgeBasePage from "./pages/knowledge_base/loan_basics/credit_score";
import ManagingDebtKnowledgeBasePage from "./pages/knowledge_base/managing_debt/main";
import GoodBadDebtKnowledgeBasePage from "./pages/knowledge_base/managing_debt/good_vs_bad_debt";
import DebtPaymentStrategiesKnowledgeBasePage from "./pages/knowledge_base/managing_debt/debt_payment_strategies";
import DefaultBankruptcyKnowledgeBasePage from "./pages/knowledge_base/managing_debt/default_bankruptcy";
import MortgagesKnowledgeBasePage from "./pages/knowledge_base/mortgages/main";
import MortgageTermsKnowledgeBasePage from "./pages/knowledge_base/mortgages/mortgage_terms";
import PropertyAssetsKnowledgeBasePage from "./pages/knowledge_base/mortgages/property_assets";
import StudentLoansKnowledgeBasePage from "./pages/knowledge_base/student_loans/main";
import AutoLoansKnowledgeBasePage from "./pages/knowledge_base/auto_loans/main";
import { User } from "./types";
import { 
  Shell,
  Calculator, 
  TrendingUp, 
  Layers, 
  User as UserIcon, 
  Menu, 
  X, 
  Coins,
  RefreshCw,
  Copy,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ACTIVE_PAGE_STORAGE_KEY = "loan-salamander-active-page";
const APP_PAGES = new Set([
  "calculator",
  "scenarios",
  "paymentScenarios",
  "refinance",
  "compareLoans",
  "kb",
  "kb-loan-basics",
  "kb-loan-basics-fixed-variable-interest",
  "kb-loan-basics-secured-unsecured",
  "kb-loan-basics-revolving-loans",
  "kb-loan-basics-credit-score",
  "kb-managing-debt",
  "kb-managing-debt-good-vs-bad-debt",
  "kb-managing-debt-payment-strategies",
  "kb-managing-debt-default-bankruptcy",
  "kb-mortgages",
  "kb-mortgages-mortgage-terms",
  "kb-mortgages-property-assets",
  "kb-student-loans",
  "kb-auto-loans",
  "profile",
  "front",
]);

function isValidPage(page: string | null): page is string {
  return Boolean(page && APP_PAGES.has(page));
}

function getPageFromLocation(): string {
  if (typeof window === "undefined") {
    return "front";
  }

  const page = new URLSearchParams(window.location.search).get("page");
  if (isValidPage(page)) {
    return page;
  }

  const sessionPage = window.sessionStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
  if (isValidPage(sessionPage)) {
    return sessionPage;
  }

  const localPage = window.localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY);
  if (isValidPage(localPage)) {
    return localPage;
  }

  return "front";
}

export default function App() {
  const [activePage, setActivePage] = useState<string>(() => getPageFromLocation());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  const [user, setUser] = useState<User | null>(null);
  const isSignedIn = Boolean(user);

  // The syncAuthSession function is responsible for synchronizing
  // the authentication session with the server. It fetches the
  // current user's authentication status and user details from
  // the backend, updating the local user state accordingly. This
  // ensures the app knows whether the user is signed in and
  // has the correct session information.
  const syncAuthSession = async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const data = await response.json();
      // If the response indicates the user is not authenticated
      // or the user data is missing, clear the local user state
      // so the app knows the user is not signed in. Otherwise,
      // populate the user state with the returned user details.
      if (!data?.authenticated || !data?.user) {
        setUser(null);
        return;
      }
      setUser({
        id: data.user.id,
        email: data.user.email,
        isPremium: Boolean(data.user.isPremium),
        premiumUntil: data.user.premiumUntil ? new Date(data.user.premiumUntil).toISOString() : null,
        token: `oauth_token_usr_${String(data.user.id)}`,
      });
    } catch {
      setUser(null);
    }
  };

  // The following useEffect initializes the authentication state
  // when the app first mounts. It triggers a session sync to
  // determine whether the user is signed in and updates the
  // loading state so the app can show appropriate UI while
  // authentication status is being determined.
  useEffect(() => {
    const initializeAuth = async () => {
      setIsAuthLoading(true);
      await syncAuthSession();
      setIsAuthLoading(false);
    };
    initializeAuth();
  }, []);

  // The following useEffect keeps the active page state in sync
  // with the URL. It reads the current page from the location
  // when the app mounts and updates the state. It also listens
  // for "popstate" events so that when the user navigates
  // using the browser back/forward buttons, the app state
  // reflects the correct page. Cleanup removes the event
  // listener when the component unmounts.
  useEffect(() => {
    const syncPageFromUrl = () => {
      setActivePage(getPageFromLocation());
    };

    syncPageFromUrl();
    window.addEventListener("popstate", syncPageFromUrl);

    return () => {
      window.removeEventListener("popstate", syncPageFromUrl);
    };
  }, []);

  // Persist the active page state to sessionStorage and localStorage,
  // and update the URL query parameter to reflect the current page. 
  // This ensures that the user's navigation state is preserved across sessions and can be shared via URL. 
  // The effect runs whenever the activePage state changes, and it updates both storage and browser history.
  useEffect(() => {
    if (typeof window === "undefined" || !isValidPage(activePage)) {
      return;
    }

    window.sessionStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, activePage);
    window.localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, activePage);

    const url = new URL(window.location.href);
    if (activePage === "front") {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", activePage);
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [activePage]);

  // Handle user login by synchronizing the authentication session and navigating to the calculator page.
  const handleLogin = async () => {
    await syncAuthSession();
    setActivePage("calculator");
  };

  // Handle user logout by clearing the user state and navigating to the front page.
  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setActivePage("front");
  };

  if (isAuthLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center text-slate-600 font-sans">
        Loading account...
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen flex text-slate-900 font-sans antialiased">

      {/* Permanent Desktop Left Sidebar Navigation */}
      <aside className={`hidden md:flex ${isSidebarCollapsed ? "w-20" : "w-64"} bg-brand-green flex-col shrink-0 fixed top-0 bottom-0 left-0 z-30 border-r border-slate-800 transition-all duration-200`}>
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((value) => !value)}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 z-40 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-accent-teal shadow-md transition hover:bg-accent-teal hover:text-white cursor-pointer"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="p-4 md:p-6 border-b border-slate-800/60">
          <button 
            onClick={() => setActivePage("front")}
            className={`flex items-center text-white hover:opacity-90 transition text-left cursor-pointer ${isSidebarCollapsed ? "justify-center" : "gap-2.5"}`}
          >
            <div className="w-8 h-8 bg-accent-teal rounded-lg flex items-center justify-center text-white font-bold text-lg font-display shadow-sm shrink-0">
              {/* TODO: Replace with logo SVG */}
              <Shell className="w-4 h-4 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block leading-tight font-display">Loan Salamander</span>
                <span className="text-[8px] font-bold text-accent-lavender block tracking-wider font-mono">RESILIENT LOAN PLANNING</span>
              </div>
            )}
          </button>
        </div>
        
        {/* Navigation panel */}
        <nav className="flex-1 px-2 py-6 space-y-1">
          <button
            onClick={() => { setActivePage("front"); }}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-2.5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left ${
              activePage === "front"
                ? "bg-accent-slate text-white"
                : "text-slate-300 hover:text-white hover:bg-accent-teal"
            }`}
            title="Overview"
          >
            <Layers className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Overview</span>}
          </button>

          <button
            onClick={() => { setActivePage("calculator"); }}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-2.5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left ${
              activePage === "calculator"
                ? "bg-accent-slate text-white"
                : "text-slate-300 hover:text-white hover:bg-accent-teal"
            }`}
            title="Amortization Calculator"
          >
            <Calculator className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Amortization Calculator</span>}
          </button>

          <button
            id="nav-compare-loans-btn"
            onClick={() => {
              setActivePage("compareLoans");
            }}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-2.5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left ${
              activePage === "compareLoans"
                ? "bg-accent-slate text-white"
                : "text-slate-300 hover:text-white hover:bg-accent-teal"
            }`}
            title="Compare Loans"
          >
            <Copy className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Compare Loans</span>}
          </button>

          <button
            id="nav-scenarios-btn"
            onClick={() => {
              setActivePage("scenarios");
            }}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-2.5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left ${
              activePage === "scenarios"
                ? "bg-accent-slate text-white"
                : "text-slate-300 hover:text-white hover:bg-accent-teal"
            }`}
            title="Variable Scenarios"
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Variable Scenarios</span>}
          </button>

          <button
            id="nav-payment-scenarios-btn"
            onClick={() => {
              setActivePage("paymentScenarios");
            }}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-2.5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left ${
              activePage === "paymentScenarios"
                ? "bg-accent-slate text-white"
                : "text-slate-300 hover:text-white hover:bg-accent-teal"
            }`}
            title="Payment Scenarios"
          >
            <Coins className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Payment Scenarios</span>}
          </button>

          <button
            id="nav-refinance-btn"
            onClick={() => {
              setActivePage("refinance");
            }}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-2.5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left ${
              activePage === "refinance"
                ? "bg-accent-slate text-white"
                : "text-slate-300 hover:text-white hover:bg-accent-teal"
            }`}
            title="Refinance Scenarios"
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Refinance Scenarios</span>}
          </button>

          <button
            onClick={() => {
              setActivePage("kb");
            }}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-2.5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left ${
              activePage === "kb" || activePage.startsWith("kb-")
                ? "bg-accent-slate text-white"
                : "text-slate-300 hover:text-white hover:bg-accent-teal"
            }`}
            title="Knowledge Base"
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>Knowledge Base</span>}
          </button>

          <button
            onClick={() => {
              setActivePage("profile");
            }}
            className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-3"} px-2.5 py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer text-left ${
              activePage === "profile"
                ? "bg-accent-slate text-white"
                : "text-slate-300 hover:text-white hover:bg-accent-teal"
            }`}
            title={!user ? "Sign In" : "Profile"}
          >
            <UserIcon className="w-4 h-4 shrink-0" />
            {!isSidebarCollapsed && <span>{user ? <>Profile <span className="text-[10px] text-slate-400">({user.email.split("@")[0]})</span></> : "Sign In"}</span>}
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 mt-auto border-t border-slate-800/60">
          {isSignedIn ? (
            <div className="bg-accent-teal rounded-xl p-3 border border-slate-700">
              {!isSidebarCollapsed ? (
                <p className="text-[10px] text-white leading-normal">Signed in: all planning tools unlocked.</p>
              ) : (
                <div className="flex justify-center">
                  <Coins className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-800 hover:border-slate-700 transition">
              {!isSidebarCollapsed ? (
                <>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Signed out</p>
                  <p className="text-[10px] text-slate-300 leading-normal mb-2">Create a local account to save configurations and sync account data.</p>
                </>
              ) : (
                <div className="flex justify-center">
                  <Coins className="w-5 h-5 text-slate-300" />
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Responsive Side Menu Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex">
          <div className="w-64 bg-slate-900 h-full flex flex-col p-5 space-y-6 relative border-r border-slate-850">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-2 pt-2 text-white">
              <div className="w-8 h-8 bg-accent-teal rounded flex items-center justify-center font-bold text-lg text-white font-display">A</div>
              <span className="font-semibold tracking-tight text-xl text-white">Loan Salamander</span>
            </div>

            <nav className="flex-1 space-y-1.5 pt-4">
              <button
                onClick={() => { setActivePage("front"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
                  activePage === "front" ? "bg-accent-slate text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Layers className="w-5 h-5 shrink-0 animate-pulse" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => { setActivePage("calculator"); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
                  activePage === "calculator" ? "bg-accent-slate text-white" : "text-slate-300 hover:text-white hover:bg-accent-teal"
                }`}
              >
                <Calculator className="w-5 h-5 shrink-0" />
                <span>Amortization Calculator</span>
              </button>

              <button
                onClick={() => {
                  setActivePage("compareLoans");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
                  activePage === "compareLoans" ? "bg-accent-slate text-white font-bold" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Copy className="w-5 h-5 shrink-0" />
                  <span>Compare Loans</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActivePage("scenarios");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
                  activePage === "scenarios" ? "bg-accent-slate text-white" : "text-slate-300 hover:text-white hover:bg-accent-teal"
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 shrink-0" />
                  <span>Variable Scenarios</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActivePage("paymentScenarios");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
                  activePage === "paymentScenarios" ? "bg-accent-slate text-white font-bold" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Coins className="w-5 h-5 shrink-0" />
                  <span>Payment Scenarios</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActivePage("refinance");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
                  activePage === "refinance" ? "bg-accent-slate text-white font-bold" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 shrink-0" />
                  <span>Refinance Scenarios</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActivePage("kb");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
                  activePage === "kb" || activePage.startsWith("kb-") ? "bg-accent-slate text-white font-bold" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 shrink-0" />
                  <span>Knowledge Base</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActivePage("profile");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer text-left ${
                  activePage === "profile" ? "bg-accent-slate text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="w-5 h-5 shrink-0" />
                  <span>{user ? "Profile" : "Sign In"}</span>
                </div>
              </button>
            </nav>

            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-slate-300 text-[10px] font-mono leading-relaxed mt-auto">
              Logged in: <span className="text-accent-teal block truncate">{user ? user.email : "Not signed in"}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Frame Area (shifted to accommodate Desktop Left Sidebar) */}
      <div className={`flex-grow flex flex-col min-h-screen transition-all duration-200 ${isSidebarCollapsed ? "md:pl-20" : "md:pl-64"}`}>
        
        {/* Dynamic Mock-header with title and indicators */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Add new pages here */}
            <h1 className="text-sm sm:text-base font-bold text-slate-800 font-display uppercase tracking-tight">
              {activePage === "front" && "Loan Salamander Overview"}
              {activePage === "calculator" && "Amortization Calculator"}
              {activePage === "scenarios" && "Variable Trade-off Scenarios & Projections"}
              {activePage === "paymentScenarios" && "Accelerated Payment Scenarios"}
              {activePage === "refinance" && "Refinance Scenarios"}
              {activePage === "compareLoans" && "Compare Loans"}
              {activePage === "kb" && "Knowledge Base"}
              {activePage === "kb-loan-basics" && "Knowledge Base - Loan Basics"}
              {activePage === "kb-loan-basics-fixed-variable-interest" && "Fixed vs variable interest rates"}
              {activePage === "kb-loan-basics-secured-unsecured" && "Secured vs unsecured loans"}
              {activePage === "kb-loan-basics-revolving-loans" && "Revolving loans"}
              {activePage === "kb-loan-basics-credit-score" && "Credit scores"}
              {activePage === "kb-managing-debt" && "Knowledge Base - Managing Debt"}
              {activePage === "kb-managing-debt-good-vs-bad-debt" && "Good vs bad debt"}
              {activePage === "kb-managing-debt-payment-strategies" && "Debt payment strategies"}
              {activePage === "kb-managing-debt-default-bankruptcy" && "Default and bankruptcy"}
              {activePage === "kb-mortgages" && "Knowledge Base - Mortgages"}
              {activePage === "kb-mortgages-mortgage-terms" && "Mortgage loan terms"}
              {activePage === "kb-mortgages-property-assets" && "Using property as a financial asset"}
              {activePage === "kb-student-loans" && "Knowledge Base - Student Loans"}
              {activePage === "kb-auto-loans" && "Knowledge Base - Auto Loans"}
              {activePage === "profile" && "User Profile"}
            </h1>
          </div>

          <div className="flex items-center gap-3.5">
            {/* User Account Initials Badge */}
            {user ? (
              <div 
                onClick={() => {
                  setActivePage("profile");
                }}
                className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold transition cursor-pointer select-none border border-slate-300 hover:bg-slate-300"
                title="Account management"
              >
                {user.email.slice(0, 2).toUpperCase()}
              </div>
            ) : (
              <button
                onClick={() => setActivePage("profile")}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer border border-slate-200"
                title="Sign In"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </header>

        {/* Core Screen Routing */}
        <main className="flex-1">
          {activePage === "front" && (
            <FrontPage 
              isSignedIn={isSignedIn}
              onNavigate={(page) => setActivePage(page)}
            />
          )}

          {activePage === "calculator" && (
            <CalculatorPage 
              isPremium={isSignedIn} 
              onUpgrade={() => setActivePage("profile")} 
            />
          )}

          {activePage === "paymentScenarios" && (
            isSignedIn ? (
              <PaymentScenariosPage 
                isPremium={isSignedIn} 
                onUpgrade={() => setActivePage("profile")}
              />
            ) : (
              <FrontPage 
                isSignedIn={isSignedIn}
                onNavigate={(page) => setActivePage(page)}
              />
            )
          )}

          {activePage === "scenarios" && (
            isSignedIn ? (
              <VariableScenariosPage />
            ) : (
              <FrontPage 
                isSignedIn={isSignedIn}
                onNavigate={(page) => setActivePage(page)}
              />
            )
          )}

          {activePage === "refinance" && (
            isSignedIn ? (
              <RefinancePage />
            ) : (
              <FrontPage
                isSignedIn={isSignedIn}
                onNavigate={(page) => setActivePage(page)}
              />
            )
          )}

          {activePage === "compareLoans" && <CompareLoansPage />}

          {/* Add new knowledge base pages here */}
          {activePage === "kb" && <KnowledgeBaseMainPage onNavigate={setActivePage} />}
          {activePage === "kb-loan-basics" && <LoanBasicsKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-loan-basics-fixed-variable-interest" && <FixedVariableInterestKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-loan-basics-secured-unsecured" && <SecuredUnsecuredKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-loan-basics-revolving-loans" && <RevolvingLoansKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-loan-basics-credit-score" && <CreditScoreKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-managing-debt" && <ManagingDebtKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-managing-debt-good-vs-bad-debt" && <GoodBadDebtKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-managing-debt-payment-strategies" && <DebtPaymentStrategiesKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-managing-debt-default-bankruptcy" && <DefaultBankruptcyKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-mortgages" && <MortgagesKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-mortgages-mortgage-terms" && <MortgageTermsKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-mortgages-property-assets" && <PropertyAssetsKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-student-loans" && <StudentLoansKnowledgeBasePage onNavigate={setActivePage} />}
          {activePage === "kb-auto-loans" && <AutoLoansKnowledgeBasePage onNavigate={setActivePage} />}

          {activePage === "profile" && (
            <ProfilePage 
              user={user} 
              onLogin={handleLogin} 
              onLogout={handleLogout}
              onOpenTools={() => {
                setActivePage("scenarios");
              }}
            />
          )}

        </main>

        {/* Structured Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 font-mono shrink-0">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>Self-hosted loan planning toolkit.</div>
          </div>
        </footer>
      </div>
    </div>
  );
}
