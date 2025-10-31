import { useEffect, useMemo, useState } from "react";
import { API } from "../../api";

type PlanUsageDetail = {
  planId: string;
  planName: string;
  isActive: boolean;
  activeSubscribers: number;
  monthlyRecurringRevenue: number;
  price: number;
  currency: string;
  shareOfSubscribersPercent: number;
};

type PlanUsageSummary = {
  generatedAt: string;
  totalActiveSubscribers: number;
  monthlyRecurringRevenue: number;
  plans: PlanUsageDetail[];
};

const AdminOverview = () => {
  const [summary, setSummary] = useState<PlanUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get<PlanUsageSummary>("/api/admin/plans/usage");
        if (!cancelled) {
          setSummary(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to load plan usage analytics. Try again shortly.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activePlans = useMemo(() => summary?.plans.filter((plan) => plan.isActive) ?? [], [summary]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
        Loading usage metrics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error}
      </div>
    );
  }

  if (!summary) {
    return null;
    /* Should never reach here but keeps TypeScript satisfied */
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Active subscribers"
          value={summary.totalActiveSubscribers.toLocaleString()}
          helper="Users with active billing status"
        />
        <MetricCard
          label="Monthly recurring revenue"
          value={`₹${summary.monthlyRecurringRevenue.toLocaleString(undefined, {
            maximumFractionDigits: 0
          })}`}
          helper="Sum across all active plans"
        />
        <MetricCard
          label="Active plans"
          value={activePlans.length.toString()}
          helper="Plans currently available for purchase"
        />
      </div>

      <section className="space-y-4">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Plan health</h2>
            <p className="text-sm text-slate-500">
              Breakdown of subscribers, MRR, and share of wallet per plan.
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Updated {new Date(summary.generatedAt).toLocaleString()}
          </span>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Subscribers</th>
                <th className="px-4 py-3 text-right">MRR</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.plans.map((plan) => (
                <tr key={plan.planId} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{plan.planName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                        plan.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${plan.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {plan.isActive ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {plan.activeSubscribers.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    ₹{plan.monthlyRecurringRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    ₹{plan.price.toLocaleString(undefined, { maximumFractionDigits: 0 })} {plan.currency}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {plan.shareOfSubscribersPercent.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
};

const MetricCard = ({ label, value, helper }: MetricCardProps) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    {helper && <p className="mt-1 text-xs text-slate-500">{helper}</p>}
  </div>
);

export default AdminOverview;
