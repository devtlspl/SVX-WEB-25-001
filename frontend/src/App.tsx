import type { ReactElement, ReactNode } from "react";
import { Navigate, Route, Routes, Link } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Subscribe from "./components/Subscribe";
import Dashboard from "./components/Dashboard";
import { useAuth } from "./context/AuthContext";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold text-brand">
            SVX Intelligence
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
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
                  {user.name} {user.isSubscribed ? "- Subscribed" : user.isRegistrationComplete ? "- Pending renewal" : "- Pending activation"}
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
      <main className="mx-auto w-full max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "₹0",
      description: "Peek into the platform with curated insights and email reports.",
      perks: ["Weekly digest", "Email support", "Limited API access"],
      cta: "Join waitlist",
      highlight: false,
      disabled: true
    },
    {
      id: "growth",
      name: "Growth",
      price: "₹499",
      description: "Unlock the complete analytics workspace with Razorpay billing.",
      perks: ["Realtime dashboards", "Unlimited API calls", "SLA-backed support"],
      cta: user ? "Activate now" : "Claim your seat",
      highlight: true,
      disabled: false
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Let’s talk",
      description: "Custom data residency and white-label experiences for your org.",
      perks: ["Dedicated support pod", "On-prem deployment", "Custom AI models"],
      cta: "Book a demo",
      highlight: false,
      disabled: true
    }
  ];

  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-3xl bg-white p-10 shadow-xl shadow-slate-100 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            New release · SVX 2.5
          </span>
          <h1 className="mt-4 text-4xl font-bold text-slate-900 sm:text-5xl">
            Intelligence for teams that need secure subscription-grade insights.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-600">
            SVX shapes your raw product usage into executive-ready narratives. Plug in, pick a plan, and start shipping
            dashboards your leadership actually reads.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {!user ? (
              <>
                <Link
                  to="/register?plan=growth"
                  className="rounded-lg bg-brand px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  Create your account
                </Link>
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className="rounded-lg bg-brand px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                >
                  Go to dashboard
                </Link>
                {!user.isSubscribed && (
                  <Link
                    to="/subscribe"
                    className="rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Activate subscription
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
          <h2 className="text-lg font-semibold text-slate-900">Why teams choose SVX</h2>
          <ul className="mt-5 space-y-4 text-sm text-slate-600">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
              Unified billing, identity and analytics in a single subscription stack.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
              Razorpay powered payments with instant entitlement updates.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
              SOC2-ready architecture leveraging ASP.NET Core and Entity Framework.
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Plans that scale with your story</h2>
          <p className="mt-3 text-sm text-slate-500">
            Pick a subscription, register in minutes, and unlock the workspace once your plan is active.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                plan.highlight ? "border-brand shadow-brand/10" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                {plan.highlight && (
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
                    Popular
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
              <p className="mt-6 text-3xl font-bold text-slate-900">{plan.price}</p>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                    {perk}
                  </li>
                ))}
              </ul>
              {plan.disabled ? (
                <span className="mt-8 inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-400">
                  {plan.cta}
                </span>
              ) : (
                <Link
                  to={user ? "/subscribe" : "/register?plan=growth"}
                  className={`mt-8 inline-flex items-center justify-center rounded-lg px-5 py-2 text-sm font-semibold transition ${
                    plan.highlight
                      ? "bg-brand text-white hover:bg-brand-dark"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl bg-slate-900 p-10 text-slate-100 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h2 className="text-3xl font-semibold">From landing page to live data in under ten minutes.</h2>
          <p className="mt-4 text-sm text-slate-300">
            1. Pick a plan and register. <br />
            2. Log in and activate your subscription with Razorpay. <br />
            3. Step inside the SVX dashboard to see curated intelligence for your business.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-white">What you&apos;ll see inside</h3>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-light" />
              Growth metrics tuned to your customer lifecycle.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-light" />
              Automation hooks to pipe insights into the tools you already use.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-light" />
              Governance controls so only the right teams see what matters.
            </li>
          </ul>
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
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

export default App;
