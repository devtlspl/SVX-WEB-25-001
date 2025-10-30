import { useAuth } from "../../context/AuthContext";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
  </div>
);

const DashboardProfile = () => {
  const { user } = useAuth();

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
    </section>
  );
};

export default DashboardProfile;
