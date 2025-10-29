import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";

type DashboardMetric = {
  Label: string;
  Value: number | string;
  Trend: string;
};

type DashboardResponse = {
  Company: string;
  Summary: string;
  Metrics: DashboardMetric[];
  Updates: string[];
};

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [status, setStatus] = useState<{ type: "error" | "info"; message: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      setStatus(null);
      try {
        const response = await API.get<DashboardResponse>("/dashboard/insights");
        setData(response.data);
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          const code = error.response?.status;
          if (code === 403) {
            setStatus({
              type: "info",
              message: "Your subscription is inactive. Upgrade your plan to access live insights."
            });
            await refreshUser();
          } else if (code === 401) {
            setStatus({
              type: "error",
              message: "Your session expired. Please log in again."
            });
          } else {
            const message =
              error.response?.data && typeof error.response.data === "object" && "message" in error.response.data
                ? String(error.response.data.message)
                : "We could not load your workspace data right now.";
            setStatus({ type: "error", message });
          }
        } else {
          setStatus({ type: "error", message: "Unexpected error while fetching data." });
        }
      } finally {
        setLoading(false);
      }
    };

    void loadInsights();
  }, [refreshUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white p-10 shadow-lg shadow-slate-100">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
        <p className="text-sm font-medium text-slate-500">Assembling your dashboard...</p>
      </div>
    );
  }

  if (status) {
    return (
      <div
        className={`rounded-2xl border bg-white p-8 shadow-lg shadow-slate-100 ${
          status.type === "error" ? "border-rose-100" : "border-amber-100"
        }`}
      >
        <h2 className="text-xl font-semibold text-slate-900">Dashboard unavailable</h2>
        <p className="mt-3 text-sm text-slate-600">{status.message}</p>
        {status.type === "info" && !user?.isSubscribed && (
          <p className="mt-4 text-sm text-slate-600">
            Visit the subscription centre to activate your plan and unlock analytics instantly.
          </p>
        )}
      </div>
    );
  }

  const metrics = Array.isArray(data?.Metrics) ? data!.Metrics : [];
  const updates = Array.isArray(data?.Updates) ? data!.Updates : [];

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-2xl bg-white p-8 shadow-lg shadow-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{data.Company}</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600">{data.Summary}</p>
            </div>
            <span className="rounded-full border border-brand/20 bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
              Subscribed Access
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {metrics.map((metric) => (
              <div key={metric.Label} className="rounded-xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.Label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.Value}</p>
                <p className="mt-1 text-xs font-medium text-emerald-600">{metric.Trend}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl bg-white p-8 shadow-lg shadow-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Latest updates</h2>
          <ul className="mt-4 space-y-4 text-sm text-slate-600">
            {updates.map((update) => (
              <li key={update} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-brand" />
                <span>{update}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-sm font-semibold text-slate-900">What&apos;s next?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Export this data into your BI stack or trigger automations via our webhook catalogue to keep your teams in
              sync.
            </p>
          </div>
        </aside>
      </div>

      <section className="rounded-2xl bg-white p-8 shadow-lg shadow-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Account &amp; KYC details</h2>
        <p className="mt-1 text-sm text-slate-500">Keep your regulatory profile current to maintain continuous access.</p>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Full name</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{user?.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mobile</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{user?.phoneNumber}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Payment verified</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {user?.paymentVerifiedAt ? new Date(user.paymentVerifiedAt).toLocaleString() : "Pending"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proof type</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{user?.governmentIdType ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document number</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{user?.governmentIdNumber ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document link</dt>
            <dd className="mt-1 text-sm font-medium text-brand">
              {user?.governmentDocumentUrl ? (
                <a href={user.governmentDocumentUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  View proof
                </a>
              ) : (
                "Not uploaded"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">KYC status</dt>
            <dd
              className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                user?.kycVerified
                  ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
                  : "border border-amber-100 bg-amber-50 text-amber-600"
              }`}
            >
              {user?.kycVerified ? "Verified" : "Pending review"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};

export default Dashboard;

