import { useEffect, useState } from "react";
import { API } from "../../api";

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  billingInterval: string;
  isActive: boolean;
  displayOrder: number;
  featureSummary?: string | null;
  createdAt: string;
  archivedAt?: string | null;
};

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get<Plan[]>("/api/admin/plans", { params: { includeArchived: true } });
        if (!cancelled) {
          const sorted = [...response.data].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));
          setPlans(sorted);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Unable to fetch plans. Please try again.");
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

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
        Loading plans…
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

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-900">Plans catalog</h2>
        <p className="text-sm text-slate-500">
          Review pricing, billing intervals, and visibility for every plan.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{plan.name}</h3>
                <p className="text-xs uppercase tracking-wide text-slate-400">{plan.billingInterval}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  plan.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                }`}
              >
                {plan.isActive && !plan.archivedAt ? "Active" : "Archived"}
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">{plan.description ?? "No description provided."}</p>

            {plan.featureSummary && (
              <p className="mt-3 rounded-xl bg-white px-4 py-3 text-xs text-slate-500">
                {plan.featureSummary}
              </p>
            )}

            <dl className="mt-4 grid gap-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Price</dt>
                <dd className="font-medium text-slate-900">
                  ₹{plan.price.toLocaleString(undefined, { maximumFractionDigits: 0 })} {plan.currency}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Display order</dt>
                <dd className="font-medium text-slate-900">{plan.displayOrder}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd>{new Date(plan.createdAt).toLocaleDateString()}</dd>
              </div>
              {plan.archivedAt && (
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Archived</dt>
                  <dd>{new Date(plan.archivedAt).toLocaleDateString()}</dd>
                </div>
              )}
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminPlans;
