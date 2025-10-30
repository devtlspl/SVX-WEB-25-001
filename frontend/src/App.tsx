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
  const highlights = [
    {
      title: "Instant clarity",
      body: "Connect your product events and see clean, decision-ready dashboards in minutes."
    },
    {
      title: "Built for busy teams",
      body: "Plain-language insights, lightweight onboarding, and transparent pricing keep everyone aligned."
    },
    {
      title: "Secure by default",
      body: "Razorpay handles billing, and OTP logins protect every session without slowing your team down."
    }
  ];

  const steps = [
    "Create your account and tell us what you want to track.",
    "Subscribe to the Growth plan and verify the payment with a one-time OTP.",
    "Open the dashboard for shareable insights, downloadable reports, and proactive nudges."
  ];

  const about = {
    intro:
      "SVX Analytics launched in 2021 with a simple goal: help product-led teams understand adoption without drowning in spreadsheets. We’ve grown into a fully remote crew of product managers, data analysts, and designers who love translating messy usage data into stories that spark action.",
    pillars: [
      {
        heading: "Human-first analytics",
        copy: "We obsess over plain language, actionable alerts, and dashboards that anyone on your team can understand in a glance."
      },
      {
        heading: "Your data, your rules",
        copy: "SOC2-ready infrastructure, regional hosting, and granular permissions mean you stay compliant without stalling experiments."
      },
      {
        heading: "Partners, not vendors",
        copy: "Every customer gets onboarding help, monthly office hours, and a real human in chat when product questions pop up."
      }
    ],
    stats: [
      { label: "Teams supported", value: "120+" },
      { label: "Dashboards shipped", value: "2,400" },
      { label: "Average onboarding time", value: "48 hrs" }
    ]
  };

  const testimonial = {
    quote:
      "The SVX Growth plan replaced three internal spreadsheets and a weekly status call. We finally have a single place to see what users do right after sign-up and which features keep them coming back.",
    author: "Mira Patel",
    role: "Head of Product, Northwind CRM"
  };

  const plans = [
    {
      id: "growth",
      name: "Growth plan",
      price: "INR 499 / month",
      description: "Everything you need to watch product and revenue signals in one simple view.",
      features: ["Unlimited dashboards", "Role-based access control", "Scheduled email digests"],
      cta: user ? "Activate now" : "Start with Growth",
      to: user ? "/subscribe" : "/register?plan=growth"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Let’s talk",
      description: "For teams that need custom data residency, on-prem hosting, or white-label journeys.",
      features: ["Dedicated success manager", "Private deployment options", "Custom SLAs"],
      cta: "Book a walkthrough",
      to: "/register?plan=growth",
      disabled: true
    }
  ];

  return (
    <div className="space-y-16">
      <section className="rounded-3xl bg-white p-10 shadow-lg shadow-slate-100">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl space-y-5">
            <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
              Meet SVX Analytics
            </span>
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
              Understand how customers use your product—without hunting through spreadsheets.
            </h1>
            <p className="text-base text-slate-600">
              SVX pulls together usage data, payments, support signals, and adoption milestones so you can focus on
              building experiences that keep customers coming back. No BI degree required—just copy, paste, and insight.
            </p>
            <div className="flex flex-wrap gap-3">
              {!user ? (
                <>
                  <Link
                    to="/register?plan=growth"
                    className="rounded-lg bg-brand px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                  >
                    Try the Growth plan
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    I already have an account
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to={user.isSubscribed ? "/dashboard" : "/subscribe"}
                    className="rounded-lg bg-brand px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                  >
                    {user.isSubscribed ? "Open dashboard" : "Finish activation"}
                  </Link>
                  <Link
                    to="/subscribe"
                    className="rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    View plans
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
            {highlights.map((item) => (
              <div key={item.title} className="space-y-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-8 rounded-3xl bg-slate-50 p-10 shadow-inner shadow-slate-200">
        <div className="max-w-3xl space-y-4 text-slate-700">
          <h2 className="text-3xl font-semibold text-slate-900">About SVX Analytics</h2>
          <p className="text-base leading-relaxed">{about.intro}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {about.pillars.map((item) => (
            <div key={item.heading} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">{item.heading}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{item.copy}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 md:grid-cols-3">
          {about.stats.map((stat) => (
            <div key={stat.label} className="space-y-2 text-center md:text-left">
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-8 shadow-lg shadow-slate-100">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-slate-900">How SVX keeps teams aligned</h2>
          <ol className="grid gap-6 text-sm text-slate-600 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-10 shadow-lg shadow-slate-100">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Trusted by growing SaaS teams</h2>
            <p className="text-base leading-relaxed text-slate-600">“{testimonial.quote}”</p>
            <p className="text-sm font-semibold text-slate-500">
              {testimonial.author} · {testimonial.role}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Why they switched to SVX</p>
            <ul className="mt-3 space-y-2">
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand" /> Unified view of sign-up, payment, and retention signals
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand" /> OTP login keeps access secure even for distributed teams
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand" /> Weekly digests flag churn risks without manual exports
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Choose the plan that fits right now</h2>
          <p className="mt-3 text-sm text-slate-500">
            Upgrade or pause anytime. Every subscription includes OTP-secured access and quick-start templates.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                plan.id === "growth" ? "border-brand shadow-brand/10" : "border-slate-200"
              }`}
            >
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.description}</p>
                <p className="text-lg font-semibold text-slate-900">{plan.price}</p>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-slate-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                    {feature}
                  </li>
                ))}
              </ul>
              {plan.disabled ? (
                <span className="mt-8 inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-400">
                  {plan.cta}
                </span>
              ) : (
                <Link
                  to={plan.to}
                  className="mt-8 inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
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
