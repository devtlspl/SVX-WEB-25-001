import type { ReactElement, ReactNode } from "react";
import { Navigate, Route, Routes, Link } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Subscribe from "./components/Subscribe";
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
            Subscriptions
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium">
            {user ? (
              <>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  {user.name} {user.isSubscribed ? "- Subscribed" : "- Free"}
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
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-2xl bg-white p-8 shadow-lg shadow-slate-100">
        <h1 className="text-3xl font-bold text-slate-900">Streamlined Subscriptions</h1>
        <p className="mt-3 max-w-xl text-slate-600">
          Securely manage user access and pricing tiers with Razorpay payments and JWT protected APIs. Register, log in,
          and upgrade in seconds.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {!user ? (
            <>
              <Link
                to="/register"
                className="rounded-lg bg-brand px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Access Dashboard
              </Link>
            </>
          ) : (
            <Link
              to="/subscribe"
              className="rounded-lg bg-brand px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              Manage Subscription
            </Link>
          )}
        </div>
      </section>
      <aside className="rounded-2xl bg-gradient-to-br from-brand via-brand-light to-sky-400 p-[1px] shadow-lg shadow-brand/30">
        <div className="h-full rounded-[calc(theme(borderRadius.2xl)-1px)] bg-white p-7">
          <h2 className="text-lg font-semibold text-slate-900">Subscription Snapshot</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-brand" />
              JWT authentication persists user state securely across sessions.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-brand" />
              Razorpay Checkout ensures seamless subscription payments.
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-brand" />
              Entity Framework Core handles SQL Server persistence.
            </li>
          </ul>
        </div>
      </aside>
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Layout>
);

export default App;
