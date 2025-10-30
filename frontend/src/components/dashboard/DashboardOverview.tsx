import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useDashboardInsights } from "../../hooks/useDashboardInsights";

const DashboardOverview = () => {
  const { user } = useAuth();
  const { data, status, loading } = useDashboardInsights();

  const planStatus = useMemo(() => {
    if (user?.isSubscribed) {
      return { label: "Active", tone: "border-emerald-200 bg-emerald-50 text-emerald-600" };
    }
    if (user?.isRegistrationComplete) {
      return { label: "Pending activation", tone: "border-amber-200 bg-amber-50 text-amber-600" };
    }
    return { label: "Setup required", tone: "border-slate-200 bg-slate-100 text-slate-600" };
  }, [user?.isRegistrationComplete, user?.isSubscribed]);

  const metrics = Array.isArray(data?.Metrics) ? data!.Metrics : [];
  const updates = Array.isArray(data?.Updates) ? data!.Updates : [];
  const planLastVerified = user?.paymentVerifiedAt ? new Date(user.paymentVerifiedAt).toLocaleString() : "Awaiting verification";
  const subscriptionId = user?.subscriptionId ? `#${user.subscriptionId}` : "Not assigned";

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
        <p className="mt-4 text-sm font-medium text-slate-500">Loading insights...</p>
      </section>
    );
  }

  if (status) {
    return (
      <section className={`rounded-xl border bg-white p-8 shadow-sm ${status.type === "error" ? "border-rose-200" : "border-amber-200"}`}>
        <h2 className="text-lg font-semibold text-slate-900">Dashboard unavailable</h2>
        <p className="mt-2 text-sm text-slate-600">{status.message}</p>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 lg:gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{data.Company}</h1>
            <p className="mt-1 text-sm text-slate-600">{data.Summary}</p>
          </div>
          <span className="rounded-full border border-brand/20 bg-brand/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand">
            Subscribed Access
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.Label} className="rounded-lg border border-slate-100 bg-slate-50 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{metric.Label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{metric.Value}</p>
              <p className="text-xs font-medium text-emerald-600">{metric.Trend}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Current plan</h2>
              <p className="mt-1 text-sm text-slate-500">
                {user?.isSubscribed
                  ? `Your usage is billed on the ${user?.activePlanName ?? "Growth"} plan.`
                  : "Activate a paid plan to unlock live data."}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${planStatus.tone}`}>
              {planStatus.label}
            </span>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subscription reference</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{subscriptionId}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last verified</dt>
              <dd className="mt-1 text-sm font-medium text-slate-900">{planLastVerified}</dd>
            </div>
          </dl>
        </div>
        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Latest updates</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {updates.map((update) => (
              <li key={update} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand" />
                <span>{update}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
};

export default DashboardOverview;
