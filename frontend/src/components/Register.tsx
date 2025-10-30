import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { API } from "../api";

type RegisterForm = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  governmentIdType: string;
  governmentIdNumber: string;
  governmentDocumentUrl: string;
  acceptTerms: boolean;
};

type StatusState = {
  type: "error" | "success" | null;
  message: string;
};

type PlanOption = {
  id: string;
  label: string;
  description: string;
  disabled?: boolean;
  helper?: string;
};

const planOptions: PlanOption[] = [
  {
    id: "starter",
    label: "Starter - Rs 0",
    description: "Market digest emails and guided onboarding.",
    disabled: true,
    helper: "Join the waitlist to unlock this tier soon."
  },
  {
    id: "growth",
    label: "Growth - Rs 499",
    description: "Live dashboards, alerts, and automated reporting."
  },
  {
    id: "pro",
    label: "Pro Trader - Rs 1,299",
    description: "Advanced analytics for prop desks and advisors."
  },
  {
    id: "institutional",
    label: "Institutional - Rs 2,999",
    description: "Multi-entity analytics with custom compliance workflows.",
    disabled: true,
    helper: "Contact us to enable institutional features."
  },
  {
    id: "enterprise",
    label: "Enterprise Plus - Custom",
    description: "Dedicated delivery pod, bespoke integrations, and SLAs.",
    disabled: true,
    helper: "Talk to sales for custom rollout."
  }
];

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    governmentIdType: "Aadhaar",
    governmentIdNumber: "",
    governmentDocumentUrl: "",
    acceptTerms: false
  });
  const [status, setStatus] = useState<StatusState>({ type: null, message: "" });
  const [loading, setLoading] = useState<boolean>(false);

  const defaultPlan = useMemo(() => {
    const requested = searchParams.get("plan") ?? "growth";
    const option = planOptions.find((planOption) => planOption.id === requested && !planOption.disabled);
    return option?.id ?? "growth";
  }, [searchParams]);
  const [plan, setPlan] = useState<string>(defaultPlan);

  useEffect(() => {
    setPlan(defaultPlan);
  }, [defaultPlan]);

  const updateField = (key: keyof RegisterForm, value: RegisterForm[keyof RegisterForm]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      localStorage.setItem("preferredPlan", plan);
      await API.post("/auth/register", form);
      setStatus({
        type: "success",
        message: "Registration successful! Redirecting to login..."
      });
      window.setTimeout(() => navigate("/login"), 1200);
    } catch (error: unknown) {
      const message =
        isAxiosError<{ message?: string }>(error) && error.response?.data?.message
          ? error.response.data.message
          : "Failed to register. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">Create your workspace</h1>
          <p className="text-sm text-slate-500">
            Already onboard?{" "}
            <Link to="/login" className="font-semibold text-brand hover:text-brand-dark">
              Log in
            </Link>
          </p>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("name", event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="Jane Doe"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("email", event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700">
                Mobile number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                value={form.phoneNumber}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("phoneNumber", event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="9876543210"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("password", event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
            <legend className="text-sm font-semibold text-slate-900">Choose your starting plan</legend>
            <p className="text-xs text-slate-500">
              Set the plan you expect to activate after onboarding. You can update this anytime.
            </p>
            <div className="space-y-3">
              {planOptions.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition ${
                    plan === option.id ? "border-brand bg-brand/5 shadow-sm shadow-brand/20" : ""
                  } ${
                    option.disabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:border-brand/40 hover:bg-brand/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={option.id}
                    checked={plan === option.id}
                    onChange={(event: ChangeEvent<HTMLInputElement>) => setPlan(event.target.value)}
                    className="mt-1 h-4 w-4 text-brand focus:ring-brand"
                    disabled={option.disabled}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                    {option.helper && <p className="mt-1 text-xs text-slate-400">{option.helper}</p>}
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-4 rounded-xl border border-slate-200 p-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">KYC information</h3>
              <p className="mt-1 text-xs text-slate-500">Provide one government-issued proof to activate your subscription.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="governmentIdType" className="block text-sm font-medium text-slate-700">
                  Proof type
                </label>
                <select
                  id="governmentIdType"
                  value={form.governmentIdType}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("governmentIdType", event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                >
                  <option value="Aadhaar">Aadhaar</option>
                  <option value="PAN">PAN</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving Licence">Driving Licence</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
              <div>
                <label htmlFor="governmentIdNumber" className="block text-sm font-medium text-slate-700">
                  Document number
                </label>
                <input
                  id="governmentIdNumber"
                  type="text"
                  value={form.governmentIdNumber}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("governmentIdNumber", event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  placeholder="Enter ID number"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="governmentDocumentUrl" className="block text-sm font-medium text-slate-700">
                  Document link (optional)
                </label>
                <input
                  id="governmentDocumentUrl"
                  type="url"
                  value={form.governmentDocumentUrl}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("governmentDocumentUrl", event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                  placeholder="Secure storage or drive link"
                />
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.acceptTerms}
              onChange={(event: ChangeEvent<HTMLInputElement>) => updateField("acceptTerms", event.target.checked)}
              className="mt-1 h-4 w-4 text-brand focus:ring-brand"
              required
            />
            <span>
              I confirm the details entered are accurate and I agree to the subscription terms, including KYC verification and billing policies.
            </span>
          </label>

          {status.type && (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                status.type === "error"
                  ? "border border-rose-100 bg-rose-50 text-rose-600"
                  : "border border-emerald-100 bg-emerald-50 text-emerald-600"
              }`}
            >
              {status.message}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:bg-brand/60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">What happens next?</h2>
        <ul className="mt-2 space-y-2">
          <li>1. We will confirm your details and guide you through payment verification.</li>
          <li>2. You can invite teammates once the Growth plan is active.</li>
          <li>3. Need help? Reach us any time at support@svxintelligence.com.</li>
        </ul>
      </div>
    </div>
  );
};

export default Register;
