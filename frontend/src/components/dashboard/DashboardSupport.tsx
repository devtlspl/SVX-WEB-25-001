import { Link } from "react-router-dom";

const DashboardSupport = () => (
  <section className="space-y-5">
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Support</h1>
          <p className="mt-1 text-sm text-slate-600">Reach us anytime - real people, no bots.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          24/7 chat
        </span>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Email</p>
          <p className="mt-1 text-sm text-slate-600">support@svxintelligence.com</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Slack Connect</p>
          <p className="mt-1 text-sm text-slate-600">Join our shared channel for priority responses.</p>
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Resources</h2>
      <ul className="mt-3 space-y-3 text-sm text-slate-600">
        <li className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <span className="font-semibold text-slate-900">Status dashboard</span>
          <Link to="#" className="text-brand hover:underline">
            status.svxintelligence.com
          </Link>
        </li>
        <li className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <span className="font-semibold text-slate-900">API docs</span>
          <Link to="#" className="text-brand hover:underline">
            developers.svxintelligence.com
          </Link>
        </li>
        <li className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
          <span className="font-semibold text-slate-900">Office hours</span>
          <span>Every Thursday, 15:00 IST &mdash; RSVP from your billing email.</span>
        </li>
      </ul>
    </div>
  </section>
);

export default DashboardSupport;
