import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const navItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/plans", label: "Plans" }
];

const AdminLayout = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">Admin console</p>
          <h1 className="text-2xl font-semibold text-slate-900">SVX Intelligence Control Centre</h1>
          <p className="mt-2 text-sm text-slate-600">Monitor plans, manage users, and keep workspaces secure.</p>
        </div>
        {user && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        )}
      </header>

      <nav className="flex flex-wrap gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "border-brand bg-brand text-white shadow-sm shadow-brand/30"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand"
              ].join(" ")
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;
