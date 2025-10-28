import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { API } from "../api";
import { useAuth, type User } from "../context/AuthContext";

type LoginForm = {
  email: string;
  password: string;
};

type StatusState = {
  type: "error" | null;
  message: string;
};

type LoginResponse = {
  token: string;
  user: User;
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: ""
  });
  const [status, setStatus] = useState<StatusState>({ type: null, message: "" });
  const [loading, setLoading] = useState<boolean>(false);

  const updateField = (key: keyof LoginForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: null, message: "" });
    setLoading(true);

    try {
      const response = await API.post<LoginResponse>("/auth/login", form);
      login(response.data);
      navigate("/subscribe");
    } catch (error: unknown) {
      const message =
        isAxiosError<{ message?: string }>(error) && error.response?.data?.message
          ? error.response.data.message
          : "Invalid credentials.";
      setStatus({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-lg shadow-slate-100">
      <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
      <p className="mt-2 text-sm text-slate-500">
        New here?{" "}
        <Link to="/register" className="font-semibold text-brand hover:text-brand-dark">
          Create an account
        </Link>
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
            placeholder="you@example.com"
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
            placeholder="Enter your password"
            required
          />
        </div>
        {status.type && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {status.message}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full justify-center rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:bg-brand/60"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
