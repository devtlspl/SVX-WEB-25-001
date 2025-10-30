import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { label: "Overview", to: ".", end: true },
  { label: "Data", to: "data" },
  { label: "Billing", to: "billing" },
  { label: "Profile", to: "profile" },
  { label: "Support", to: "support" }
];

const DashboardLayout = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 md:space-y-0 xl:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:sticky md:top-24 md:self-start">
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Welcome back</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <nav className="space-y-1 text-sm font-semibold text-slate-600">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2 transition ${
                    isActive ? "bg-brand/10 text-brand" : "hover:bg-slate-100"
                  }`
                }
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-400">&gt;</span>
              </NavLink>
            ))}
          </nav>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-900">Need to update billing?</p>
            <p className="mt-1 leading-relaxed">
              Keep payment details current to avoid access interruptions. Manage invoices from the billing centre.
            </p>
            <Link
              to="/subscribe"
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Manage billing
            </Link>
          </div>
        </div>
      </aside>

      <div className="space-y-5">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
