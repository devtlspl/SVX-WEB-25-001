import { FormEvent, useEffect, useMemo, useState } from "react";
import { API } from "../../api";

type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  isSubscribed: boolean;
  activePlanId?: string | null;
  activePlanName?: string | null;
  paymentVerifiedAt?: string | null;
  roles: string[];
};

type AdminUserPlanHistoryItem = {
  planId: string;
  planName: string;
  status: string;
  amount: number;
  currency: string;
  subscribedAt: string;
  cancelledAt?: string | null;
};

type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  isSubscribed: boolean;
  kycVerified: boolean;
  isRegistrationComplete: boolean;
  termsAcceptedAt?: string | null;
  riskPolicyAcceptedAt?: string | null;
  activePlanId?: string | null;
  activePlanName?: string | null;
  activePlanAmount?: number | null;
  activePlanCurrency?: string | null;
  pendingPlanId?: string | null;
  pendingPlanName?: string | null;
  pendingPlanAmount?: number | null;
  pendingPlanCurrency?: string | null;
  roles: string[];
  planHistory: AdminUserPlanHistoryItem[];
};

type UserUsageSummary = {
  userId: string;
  totalLogins: number;
  activeSessions: number;
  totalScreenTimeMinutes: number;
  lastLoginAt?: string | null;
  uniqueDeviceCount: number;
  recentSessions: UserSessionSummary[];
};

type UserSessionSummary = {
  sessionId: string;
  sessionIdentifier: string;
  loginType: string;
  createdAt: string;
  lastSeenAt: string;
  ipAddress?: string | null;
  lastSeenIpAddress?: string | null;
  deviceName?: string | null;
  isActive: boolean;
};

type PasswordResetResponse = {
  tokenId: string;
  userId: string;
  token: string;
  expiresAt: string;
};

const AdminUsers = () => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [usageSummary, setUsageSummary] = useState<UserUsageSummary | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [resetState, setResetState] = useState<PasswordResetResponse | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoadingUsers(true);
      setError(null);
      try {
        const response = await API.get<AdminUserSummary[]>("/api/admin/users", {
          params: {
            search: search.trim() || undefined,
            includeInactive,
            take: 50
          },
          signal: controller.signal
        });
        if (!cancelled) {
          setUsers(response.data);
        }
      } catch (err) {
        if (!cancelled && !controller.signal.aborted) {
          setError("Unable to load users. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoadingUsers(false);
        }
      }
    };

    const timeout = window.setTimeout(() => {
      void load();
    }, 300);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [search, includeInactive]);

  useEffect(() => {
    if (!selectedUserId) {
      setUserDetail(null);
      setUsageSummary(null);
      setResetState(null);
      setDetailError(null);
      return;
    }

    let cancelled = false;
    const detailController = new AbortController();
    const usageController = new AbortController();

    const loadDetail = async () => {
      setDetailError(null);
      setUserDetail(null);
      setUsageSummary(null);
      setResetState(null);
      try {
        const [detailResponse, usageResponse] = await Promise.all([
          API.get<AdminUserDetail>(`/api/admin/users/${selectedUserId}`, { signal: detailController.signal }),
          API.get<UserUsageSummary>(`/api/admin/users/${selectedUserId}/usage`, { signal: usageController.signal })
        ]);

        if (!cancelled) {
          setUserDetail(detailResponse.data);
          setUsageSummary(usageResponse.data);
        }
      } catch (err) {
        if (!cancelled && !detailController.signal.aborted && !usageController.signal.aborted) {
          setDetailError("Unable to load user details. Please try again.");
        }
      }
    };

    void loadDetail();

    return () => {
      cancelled = true;
      detailController.abort();
      usageController.abort();
    };
  }, [selectedUserId]);

  const handleGenerateReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) return;

    const formData = new FormData(event.currentTarget);
    const reason = (formData.get("reason") as string | null)?.trim() ?? undefined;
    const lifetime = formData.get("lifetime") as string | null;
    const lifetimeMinutes = lifetime ? Number(lifetime) : undefined;

    setResetLoading(true);
    setResetError(null);

    try {
      const response = await API.post<PasswordResetResponse>(`/api/admin/users/${selectedUserId}/password-reset`, {
        reason: reason || undefined,
        lifetimeMinutes: lifetimeMinutes || undefined
      });
      setResetState(response.data);
    } catch (err) {
      setResetError("Unable to create a reset token. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const selectedSummary = useMemo(() => users.find((user) => user.id === selectedUserId), [users, selectedUserId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
      <section className="space-y-4">
        <header className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Manage users</h2>
            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              Include inactive
            </label>
          </div>
          <p className="text-xs text-slate-500">Search by name, email, or phone number to review workspace access.</p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users..."
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
          />
        </header>

        <div className="rounded-2xl border border-slate-200 bg-white">
          {loadingUsers ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-500">Loading users…</div>
          ) : error ? (
            <div className="p-4 text-sm text-rose-600">{error}</div>
          ) : users.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No users found.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {users.map((user) => {
                const active = user.id === selectedUserId;
                return (
                  <li key={user.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition ${
                        active ? "bg-brand/5" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
                        <span>{user.name}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            user.isSubscribed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {user.isSubscribed ? "Active" : "Pending"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{user.email}</span>
                        <span>•</span>
                        <span>{user.phoneNumber}</span>
                        {user.activePlanName && (
                          <>
                            <span>•</span>
                            <span>{user.activePlanName}</span>
                          </>
                        )}
                        {user.roles.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="uppercase tracking-wide">{user.roles.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-4">
        {!selectedUserId || loadingUsers ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
            Select a user to inspect their access, sessions, and plan history.
          </div>
        ) : detailError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {detailError}
          </div>
        ) : !userDetail ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-500">
            Loading user details…
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{userDetail.name}</h2>
                  <p className="text-xs text-slate-500">{userDetail.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userDetail.roles.map((role) => (
                    <span key={role} className="rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                      {role}
                    </span>
                  ))}
                </div>
              </header>

              <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                <DetailItem label="Phone" value={userDetail.phoneNumber} />
                <DetailItem label="KYC status" value={userDetail.kycVerified ? "Verified" : "Pending"} />
                <DetailItem label="Registration" value={userDetail.isRegistrationComplete ? "Complete" : "Incomplete"} />
                <DetailItem
                  label="Active plan"
                  value={userDetail.activePlanName ?? "—"}
                  helper={userDetail.activePlanAmount ? `₹${userDetail.activePlanAmount} ${userDetail.activePlanCurrency ?? ""}` : undefined}
                />
                <DetailItem
                  label="Pending plan"
                  value={userDetail.pendingPlanName ?? "—"}
                  helper={
                    userDetail.pendingPlanAmount
                      ? `₹${userDetail.pendingPlanAmount} ${userDetail.pendingPlanCurrency ?? ""}`
                      : undefined
                  }
                />
                <DetailItem
                  label="Terms accepted"
                  value={userDetail.termsAcceptedAt ? new Date(userDetail.termsAcceptedAt).toLocaleDateString() : "—"}
                />
                <DetailItem
                  label="Risk policy"
                  value={userDetail.riskPolicyAcceptedAt ? new Date(userDetail.riskPolicyAcceptedAt).toLocaleDateString() : "—"}
                />
              </dl>
            </div>

            {usageSummary && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900">Session activity</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Metric label="Total logins" value={usageSummary.totalLogins.toLocaleString()} />
                  <Metric label="Active sessions" value={usageSummary.activeSessions.toLocaleString()} />
                  <Metric label="Unique devices" value={usageSummary.uniqueDeviceCount.toString()} />
                </div>
                <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent sessions</h4>
                  <div className="mt-2 space-y-2">
                    {usageSummary.recentSessions.length === 0 ? (
                      <p className="text-xs text-slate-500">No sessions recorded.</p>
                    ) : (
                      usageSummary.recentSessions.slice(0, 5).map((session) => (
                        <div
                          key={session.sessionId}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600"
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-slate-900">{session.deviceName ?? "Unknown device"}</span>
                            <span>{session.sessionIdentifier}</span>
                          </div>
                          <div className="text-right">
                            <p>{new Date(session.createdAt).toLocaleString()}</p>
                            <p className="text-[11px] text-slate-400">
                              Last seen {new Date(session.lastSeenAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Plan history</h3>
              <div className="mt-3 space-y-2">
                {userDetail.planHistory.length === 0 ? (
                  <p className="text-xs text-slate-500">No plan history recorded.</p>
                ) : (
                  userDetail.planHistory.map((entry) => (
                    <div key={`${entry.planId}-${entry.subscribedAt}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">{entry.planName}</p>
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                            entry.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-500">
                        <span>₹{entry.amount} {entry.currency}</span>
                        <span>•</span>
                        <span>From {new Date(entry.subscribedAt).toLocaleDateString()}</span>
                        {entry.cancelledAt && (
                          <>
                            <span>•</span>
                            <span>Until {new Date(entry.cancelledAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-900">Password reset</h3>
              <p className="mt-1 text-xs text-slate-500">
                Generate a secure link to help the user regain access. Share the token through a trusted channel.
              </p>
              <form className="mt-4 space-y-3" onSubmit={handleGenerateReset}>
                <div className="grid gap-2 text-sm text-slate-600">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="reason">
                    Reason (optional)
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={2}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                    placeholder="e.g. Requested by support ticket #1234"
                  />
                </div>
                <div className="grid gap-2 text-sm text-slate-600">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="lifetime">
                    Lifetime (minutes, optional)
                  </label>
                  <input
                    id="lifetime"
                    name="lifetime"
                    type="number"
                    min={5}
                    max={10080}
                    step={5}
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/10"
                    placeholder="Default 24 hours"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Creating…" : "Generate link"}
                </button>
              </form>
              {resetError && <p className="mt-3 text-xs text-rose-600">{resetError}</p>}
              {resetState && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700">
                  <p className="font-semibold text-emerald-800">Reset token created</p>
                  <p className="mt-2 break-all font-mono text-[11px] text-emerald-800">{resetState.token}</p>
                  <p className="mt-2 text-slate-600">
                    Expires {new Date(resetState.expiresAt).toLocaleString()}. Send this token as part of a secure reset link on your frontend
                    (e.g. <code className="rounded bg-white px-1 py-0.5">/reset?token=…</code>).
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

type DetailItemProps = {
  label: string;
  value: string;
  helper?: string;
};

const DetailItem = ({ label, value, helper }: DetailItemProps) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    {helper && <p className="text-xs text-slate-500">{helper}</p>}
  </div>
);

type MetricProps = {
  label: string;
  value: string;
};

const Metric = ({ label, value }: MetricProps) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
    <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
  </div>
);

export default AdminUsers;
