import { useDashboardInsights } from "../../hooks/useDashboardInsights";

const DashboardData = () => {
  const { data, loading, status, reload } = useDashboardInsights();

  if (loading) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
        <p className="mt-4 text-sm font-medium text-slate-500">Loading usage details...</p>
      </section>
    );
  }

  if (status) {
    return (
      <section className={`rounded-xl border bg-white p-8 shadow-sm ${status.type === "error" ? "border-rose-200" : "border-amber-200"}`}>
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Data unavailable</h2>
            <p className="text-sm text-slate-600">{status.message}</p>
          </div>
          <button
            type="button"
            onClick={() => reload()}
            className="inline-flex w-fit items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-slate-900">Engagement snapshot</h1>
          <p className="text-sm text-slate-600">
            Track your product health at a glance. Each metric combines transactional, billing, and behavioural signals so your team has a single source of truth.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.Metrics.map((metric) => (
            <article key={metric.Label} className="rounded-lg border border-slate-100 bg-slate-50 p-4 shadow-sm">
              <header className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{metric.Label}</header>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.Value}</p>
              <p className="text-xs font-medium text-emerald-600">{metric.Trend}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Automation ideas</h2>
        <p className="mt-1 text-sm text-slate-600">
          Put your numbers to work with focused follow-ups. These prompts refresh as your metrics change.
        </p>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          {data.Updates.map((update) => (
            <li key={update} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
              {update}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default DashboardData;
