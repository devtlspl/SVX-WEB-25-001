import type { ReactElement, ReactNode } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Subscribe from "./components/Subscribe";
import Dashboard, {
  DashboardBilling,
  DashboardData,
  DashboardOverview,
  DashboardProfile,
  DashboardSupport
} from "./components/Dashboard";
import { useAuth } from "./context/AuthContext";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const onDashboard = location.pathname.startsWith("/dashboard");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <Link to="/" className="text-lg font-semibold text-brand">
            SVX Intelligence
          </Link>
          <nav className="flex items-center gap-2 text-sm font-medium">
            {user ? (
              <>
                {user.isSubscribed && (
                  <Link
                    to="/dashboard"
                    className="rounded-md border border-transparent px-4 py-2 text-slate-700 transition hover:bg-slate-100"
                  >
                    Dashboard
                  </Link>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  {`${user.name} ${user.isSubscribed ? "- Subscribed" : user.isRegistrationComplete ? "- Pending renewal" : "- Pending activation"}`}
                </span>
                <Link
                  to="/subscribe"
                  className="rounded-md bg-brand px-4 py-2 text-white transition hover:bg-brand-dark"
                >
                  Manage Plan
                </Link>
                <button
                  onClick={logout}
                  className="rounded-md border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-100"
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md border border-slate-200 px-4 py-2 text-slate-700 transition hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-brand px-4 py-2 text-white transition hover:bg-brand-dark"
                >
                  Join Now
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className={`mx-auto w-full px-4 py-10 ${onDashboard ? "max-w-6xl" : "max-w-5xl md:max-w-6xl"}`}>
        {children}
      </main>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();

  const featureCards = [
    {
      title: "Signal clarity in minutes",
      copy: "Pre-built market templates spotlight top movers, liquidity, and risk without spreadsheet wrangling."
    },
    {
      title: "Built for trading desks",
      copy: "Plain-language dashboards, saved views, and alerts keep research, trading, and compliance aligned."
    },
    {
      title: "Secure team access",
      copy: "Role-based workspaces, OTP logins, and audit-ready exports protect client data while you scale."
    }
  ];

  const launchSteps = [
    "Choose the markets and instruments you track today, along with the KPIs you report on.",
    "Sync broker or market data feeds, verify billing through Razorpay, and upload required KYC documents.",
    "Invite teammates to dashboards that refresh with new trades, P&L, and risk alerts automatically."
  ];

  const plans = [
    {
      id: "starter",
      title: "Starter",
      price: "Free",
      description: "Market digest emails and guided setup.",
      features: ["Weekly trading digest", "Guided onboarding", "Email support"],
      cta: "Join waitlist",
      to: "#",
      highlighted: false,
      disabled: true
    },
    {
      id: "growth",
      title: "Growth",
      price: "Rs 499 / month",
      description: "Live dashboards, alerts, and automated reporting.",
      features: ["Intraday dashboards", "Trade alerts and webhooks", "Billing and KYC controls"],
      cta: user?.isSubscribed ? "Go to dashboard" : "Start 14-day trial",
      to: user?.isSubscribed ? "/dashboard" : "/subscribe",
      highlighted: true,
      disabled: false
    },
    {
      id: "pro",
      title: "Pro Trader",
      price: "Rs 1,299 / month",
      description: "Advanced analytics for prop desks and advisory teams.",
      features: ["Segmented P&L views", "Strategy backtests", "Priority success desk"],
      cta: user?.isSubscribed ? "Upgrade to Pro" : "Start with Pro",
      to: "/subscribe",
      highlighted: false,
      disabled: false
    },
    {
      id: "institutional",
      title: "Institutional",
      price: "Rs 2,999 / month",
      description: "Multi-entity analytics with custom compliance workflows.",
      features: ["Multi-account rollups", "Custom compliance reports", "Quarterly strategy reviews"],
      cta: "Request a call",
      to: "#",
      highlighted: false,
      disabled: true
    },
    {
      id: "enterprise",
      title: "Enterprise Plus",
      price: "Custom",
      description: "Dedicated delivery pod, bespoke integrations, and SLAs.",
      features: ["Private deployment options", "Dedicated analyst desk", "Executive-ready client reports"],
      cta: "Talk to sales",
      to: "#",
      highlighted: false,
      disabled: true
    }
  ];

  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-3xl bg-white p-10 shadow-lg shadow-brand/5 md:grid-cols-[1.15fr_1fr] md:items-center">
        <div className="space-y-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            Trading intelligence, simplified
          </span>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-[2.9rem]">
            A calmer command centre for trading, research, and client teams.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600">SVX keeps market data, trade performance, and client exposure in one tidy workspace. No more spreadsheet glue or status decks; just signals your desks can act on in minutes.</p>
          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <Link
                  to={user.isSubscribed ? "/dashboard" : "/subscribe"}
                  className="inline-flex items-center rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  {user.isSubscribed ? "Open dashboard" : "Activate workspace"}
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Preview layout
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  Create free account
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
          <dl className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Teams onboarded", value: "120+" },
              { label: "Dashboards shipped", value: "2,400" },
              { label: "Avg. setup time", value: "48 hrs" }
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                <dd className="text-2xl font-semibold text-slate-900">{stat.value}</dd>
                <dt className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-900/95 p-6 text-slate-100 shadow-inner">
          <p className="text-sm font-semibold text-white">What gets automated</p>
          <ul className="space-y-3 text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Activation, retention, and revenue signals stitched into tidy dashboards.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>OTP-secured access, Razorpay billing, and KYC workflows handled in-app.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Weekly nudges that highlight churn risk before it bites.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {featureCards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.copy}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 rounded-3xl bg-white p-10 shadow-lg shadow-slate-100 md:grid-cols-[1.15fr_1fr] md:items-center">
        <div className="space-y-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Quick launch</p>
          <h2 className="text-3xl font-bold leading-tight text-slate-900">Three steps and you're sharing a live dashboard</h2>
          <ol className="space-y-4 text-sm leading-relaxed text-slate-600">
            {launchSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-lg font-semibold text-slate-900">Why trading teams choose SVX</h3>
          <ul className="mt-2 space-y-3 text-sm text-slate-600">
            {[
              "Single workspace to evaluate market signals, trade performance, and client exposure.",
              "Real-time alerts land in Slack or email so desks can act without status calls.",
              "Direct access to trading specialists who help configure strategies and reports."
            ].map((line) => (
              <li key={line} className="rounded-xl bg-white px-4 py-3 shadow-sm">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-3xl bg-slate-900 p-10 text-slate-200 shadow-lg">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold leading-snug text-white">&quot;The signal alerts now do the work of three desks.&quot;</h2>
            <p className="text-sm text-slate-300">
              SVX pulls together trade flows, P&L, and client exposure into one view. Our dealers get alerted before spreads widen, risk sees the whole book, and leadership reviews a single market brief each morning.
            </p>
            <p className="text-sm font-semibold text-emerald-300">Aditi Rao - Trading Lead, Northwind Markets</p>
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-700 bg-slate-800/60 p-6 text-sm leading-relaxed">
            <p className="font-semibold text-white">What changed for Northwind</p>
            <ul className="mt-3 space-y-3">
              {[
                "Intraday alerts land in Slack the moment spreads break tolerance.",
                "Risk teams get automated end-of-day summaries with client P&L.",
                "Clients receive branded dashboards instead of static PDFs."
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Pricing that scales with confidence</h2>
          <p className="mt-3 text-sm text-slate-500">Start for free, switch on live dashboards when you're ready.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                plan.highlighted ? "border-brand shadow-brand/10" : "border-slate-200"
              }`}
            >
              <div className="space-y-1.5">
                <h3 className="text-xl font-semibold text-slate-900">{plan.title}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
                <p className="text-lg font-semibold text-slate-900">{plan.price}</p>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {plan.disabled ? (
                <span className="mt-8 inline-flex items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-400">
                  {plan.cta}
                </span>
              ) : (
                <Link
                  to={plan.to}
                  className="mt-8 inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-100">
        <h2 className="text-3xl font-bold text-slate-900">Ready when you are</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">
          Spin up your workspace in minutes and invite your team once the dashboards click. Our specialists are ready to help
          with instrumentation, Razorpay setup, or migration planning.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to={user ? "/dashboard" : "/register"}
            className="inline-flex items-center rounded-md bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {user ? "Open your workspace" : "Create an account"}
          </Link>
          {!user && (
            <Link
              to="/login"
              className="inline-flex items-center rounded-md border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Sign in
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

type ProtectedRouteProps = {
  children: ReactElement;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const SubscribedRoute = ({ children }: ProtectedRouteProps) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.isRegistrationComplete) {
    return <Navigate to="/subscribe" replace />;
  }
  if (!user.isSubscribed) {
    return <Navigate to="/subscribe" replace />;
  }
  return children;
};

const App = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/subscribe"
        element={
          <ProtectedRoute>
            <Subscribe />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <SubscribedRoute>
            <Dashboard />
          </SubscribedRoute>
        }
      >
        <Route index element={<DashboardOverview />} />
        <Route path="data" element={<DashboardData />} />
        <Route path="billing" element={<DashboardBilling />} />
        <Route path="profile" element={<DashboardProfile />} />
        <Route path="support" element={<DashboardSupport />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

export default App;
