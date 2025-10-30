import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useDashboardInsights } from "../../hooks/useDashboardInsights";

type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  planId: string | null;
  planName: string | null;
  amount: number;
  currency: string;
  paymentId: string;
  issuedAt: string;
};

const DashboardBilling = () => {
  const { user } = useAuth();
  const { data } = useDashboardInsights();
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(true);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  useEffect(() => {
    const loadInvoices = async () => {
      setInvoicesLoading(true);
      setInvoiceError(null);
      try {
        const response = await API.get<{ invoices: BillingInvoice[] }>("/billing/invoices");
        setInvoices(response.data.invoices ?? []);
      } catch (error) {
        setInvoiceError("We couldn't load invoices right now. Please try again later.");
      } finally {
        setInvoicesLoading(false);
      }
    };

    void loadInvoices();
  }, []);

  const planLastVerified = useMemo(
    () => (user?.paymentVerifiedAt ? new Date(user.paymentVerifiedAt).toLocaleString() : "Awaiting verification"),
    [user?.paymentVerifiedAt]
  );

  const subscriptionId = user?.subscriptionId ? `#${user.subscriptionId}` : "Not assigned";
  const planStatusLabel = user?.isSubscribed
    ? `Active (${user?.activePlanName ?? "Growth"})`
    : user?.isRegistrationComplete
      ? "Pending activation"
      : "Inactive";

  const activePlanAmount = user?.activePlanAmount != null
    ? `Rs ${user.activePlanAmount.toFixed(2)}`
    : user?.isSubscribed
      ? "Pending amount"
      : "Rs 0.00";

  const formatAmount = (amount: number, currency: string) => {
    const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
    return currency?.toUpperCase() === "INR" ? `Rs ${rounded.toFixed(2)}` : `${currency?.toUpperCase() ?? "INR"} ${rounded.toFixed(2)}`;
  };

  const downloadInvoice = async (invoice: BillingInvoice) => {
    try {
      const response = await API.get(`/billing/invoices/${invoice.id}/download`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-${invoice.invoiceNumber}.txt`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setInvoiceError("Unable to download the invoice. Please try again.");
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Billing &amp; plan</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your subscription, invoices, and renewal preferences.</p>
          </div>
          <Link
            to="/subscribe"
            className="inline-flex items-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Open billing centre
          </Link>
        </div>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Plan status</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{planStatusLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active plan amount</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{activePlanAmount}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subscription reference</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{subscriptionId}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last payment verification</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{planLastVerified}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">KYC status</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{user?.kycVerified ? "Verified" : "Pending review"}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Invoices</h2>
        <p className="mt-1 text-sm text-slate-600">Download invoices instantly after each successful subscription payment.</p>
        {invoiceError && <p className="mt-3 text-sm text-rose-600">{invoiceError}</p>}
        {invoicesLoading ? (
          <p className="mt-4 text-sm text-slate-500">Loading invoices...</p>
        ) : invoices.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Invoices will appear here once a subscription payment is completed.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Invoice #</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Issued</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-3 py-3 font-medium text-slate-900">{invoice.invoiceNumber}</td>
                    <td className="px-3 py-3">{invoice.planName ?? "Growth"}</td>
                    <td className="px-3 py-3">{formatAmount(invoice.amount, invoice.currency)}</td>
                    <td className="px-3 py-3">{new Date(invoice.issuedAt).toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => downloadInvoice(invoice)}
                        className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Usage digest</h2>
        <p className="mt-1 text-sm text-slate-600">Headline metrics so you know what you are paying for.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.Metrics?.map((metric) => (
            <div key={metric.Label} className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{metric.Label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{metric.Value}</p>
            </div>
          )) ?? (
            <p className="text-sm text-slate-500">Metrics will appear once your dashboard data is ready.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default DashboardBilling;
