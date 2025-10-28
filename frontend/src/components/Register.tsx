import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { API } from "../api";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
};

type StatusState = {
  type: "error" | "success" | null;
  message: string;
};

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: ""
  });
  const [status, setStatus] = useState<StatusState>({ type: null, message: "" });
  const [loading, setLoading] = useState<boolean>(false);

  const updateField = (key: keyof RegisterForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });

    try {
      await API.post("/auth/register", form);
      setStatus({ type: "success", message: "Registration successful! Redirecting to login..." });
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
