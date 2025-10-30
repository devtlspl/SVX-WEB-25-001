import { useState } from "react";
import { RISK_POLICY_POINTS, USER_AGREEMENT_POINTS } from "../../constants/policies";
import { useAuth } from "../../context/AuthContext";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
  </div>
);

const DashboardProfile = () => {
  const { user } = useAuth();
  const [modal, setModal] = useState<"agreement" | "risk" | null>(null);

  const formatTimestamp = (value?: string | null) => {
    if (!value) {
      return "Not recorded";
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "Not recorded" : parsed.toLocaleString();
  };

  return (
    <section className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Profile &amp; compliance</h1>
        <p className="mt-1 text-sm text-slate-600">
          Keep these details current so we can support your workspace without interruption.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoRow label="Full name" value={user?.name ?? "-"} />
          <InfoRow label="Email" value={user?.email ?? "-"} />
          <InfoRow label="Mobile" value={user?.phoneNumber ?? "-"} />
          <InfoRow
            label="Payment verified"
            value={user?.paymentVerifiedAt ? new Date(user.paymentVerifiedAt).toLocaleString() : "Pending"}
          />
          <InfoRow label="Government ID type" value={user?.governmentIdType ?? "-"} />
          <InfoRow label="Government ID number" value={user?.governmentIdNumber ?? "-"} />
          <InfoRow label="KYC status" value={user?.kycVerified ? "Verified" : "Pending review"} />
          <InfoRow label="Subscription reference" value={user?.subscriptionId ?? "Not assigned"} />
          <InfoRow label="User agreement accepted" value={formatTimestamp(user?.termsAcceptedAt)} />
          <InfoRow label="Risk policy acknowledged" value={formatTimestamp(user?.riskPolicyAcceptedAt)} />
        </dl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Compliance tips</h2>
        <ul className="mt-3 space-y-3 text-sm text-slate-600">
          <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            Assemble a dedicated billing contact so invoices never miss an approval cycle.
          </li>
          <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            Store your government documents in a shared vault and rotate access every quarter.
          </li>
          <li className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            Enable webhook alerts to be notified instantly if KYC status changes.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Reference the agreements</h2>
        <p className="mt-1 text-sm text-slate-600">
          Revisit the language you agreed to during registration whenever you need to brief stakeholders.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setModal("agreement")}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View user agreement
          </button>
          <button
            type="button"
            onClick={() => setModal("risk")}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View risk policy
          </button>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {modal === "agreement" ? "User agreement" : "Trading risk policy"}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5 text-sm leading-relaxed text-slate-600">
              <ul className="space-y-3">
                {(modal === "agreement" ? USER_AGREEMENT_POINTS : RISK_POLICY_POINTS).map((item) => (
                  <li key={item} className="flex gap-2 text-left">
                    <span>-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DashboardProfile;
