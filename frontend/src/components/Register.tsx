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

const planOptions = [
  {
    id: "growth",
    label: "Growth · ₹499",
    description: "Full analytics workspace with realtime dashboards."
  },
  {
    id: "starter",
    label: "Starter · ₹0",
    description: "Weekly digest and limited usage to explore the platform.",
    disabled: true,
    helper: "Launching with early access soon."
  },
  {
    id: "enterprise",
    label: "Enterprise · Let's talk",
    description: "Dedicated success pod and custom deployment.",
    disabled: true,
    helper: "Contact our sales team for bespoke pricing."
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
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-lg shadow-slate-100">
      <h2 className="text-2xl font-bold text-slate-900">Create account</h2>
      <p className="mt-2 text-sm text-slate-500">
        Already onboard?{" "}
        <Link to="/login" className="font-semibold text-brand hover:text-brand-dark">
          Log in
        </Link>
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="Jane Doe"
            required
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("email", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="jane@example.com"
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
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("phoneNumber", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="9876543210"
            required
          />
        </div>
        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-2 text-sm font-semibold text-slate-700">Select a plan</legend>
          <div className="mt-2 space-y-3">
            {planOptions.map((option) => {
              const isDisabled = Boolean(option.disabled);
              return (
                <label
                  key={option.id}
                  className={`flex gap-3 rounded-lg border border-transparent p-3 ${
                    isDisabled
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
                    disabled={isDisabled}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                    {option.helper && <p className="mt-1 text-xs text-slate-400">{option.helper}</p>}
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">KYC information</h3>
            <p className="mt-1 text-xs text-slate-500">
              Provide one government issued proof to activate your subscription.
            </p>
          </div>
          <div>
            <label htmlFor="governmentIdType" className="block text-sm font-medium text-slate-700">
              Proof type
            </label>
            <select
              id="governmentIdType"
              value={form.governmentIdType}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => updateField("governmentIdType", event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              placeholder="Secure storage or drive link"
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("password", e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            placeholder="Minimum 6 characters"
            minLength={6}
            required
          />
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
            I confirm the details entered are accurate and I agree to the subscription terms, including KYC verification
            and billing policies.
          </span>
        </label>
        {status.type && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              status.type === "error"
                ? "bg-rose-50 text-rose-600 border border-rose-100"
                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
            }`}
          >
            {status.message}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:bg-brand/60"
        >
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default Register;
