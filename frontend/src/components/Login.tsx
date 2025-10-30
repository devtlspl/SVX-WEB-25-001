import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { API } from "../api";
import { useAuth, type User } from "../context/AuthContext";

type CredentialsForm = {
  phoneNumber: string;
  password: string;
};

type OtpForm = {
  phoneNumber: string;
  code: string;
};

type StatusState = {
  type: "error" | "success" | null;
  message: string;
};

type LoginResponse = {
  token: string;
  user: User;
};

type RequestOtpResponse = {
  message: string;
  expiresAt: string;
  isActive: boolean;
  debugCode?: string;
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [credentials, setCredentials] = useState<CredentialsForm>({
    phoneNumber: "",
    password: ""
  });
  const [otp, setOtp] = useState<OtpForm>({
    phoneNumber: "",
    code: ""
  });
  const [status, setStatus] = useState<StatusState>({ type: null, message: "" });
  const [loading, setLoading] = useState<boolean>(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isActiveAccount, setIsActiveAccount] = useState<boolean | null>(null);

  const updateCredentials = (key: keyof CredentialsForm, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const updateOtp = (value: string) => {
    setOtp((prev) => ({ ...prev, code: value }));
  };

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const response = await API.post<RequestOtpResponse>(
        "/auth/login/request-otp",
        credentials
      );
      const successMessage = response.data.isActive
        ? response.data.message
        : `${response.data.message} Complete your subscription once inside to activate your workspace.`;
      setStatus({ type: "success", message: successMessage });
      setOtp({
        phoneNumber: credentials.phoneNumber,
        code: ""
      });
      setDebugCode(response.data.debugCode ?? null);
      setExpiresAt(response.data.expiresAt);
      setIsActiveAccount(response.data.isActive);
      setStep("otp");
    } catch (error: unknown) {
      const message =
        isAxiosError<{ message?: string }>(error) && error.response?.data?.message
          ? error.response.data.message
          : "Unable to send OTP.";
      setStatus({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const response = await API.post<LoginResponse>("/auth/login/verify-otp", otp);
      login(response.data);
      navigate("/dashboard");
    } catch (error: unknown) {
      const message =
        isAxiosError<{ message?: string }>(error) && error.response?.data?.message
          ? error.response.data.message
          : "OTP verification failed.";
      setStatus({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">
          Sign in with your mobile number. We&apos;ll send a one-time password to keep your workspace secure.
        </p>

        {step === "credentials" ? (
          <form className="mt-6 space-y-4" onSubmit={requestOtp}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                Mobile number
              </label>
              <input
                id="phone"
                type="tel"
                value={credentials.phoneNumber}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateCredentials("phoneNumber", event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                value={credentials.password}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateCredentials("password", event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="Enter your password"
                required
              />
            </div>
            {status.type && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
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
              {loading ? "Sending OTP..." : "Request OTP"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={verifyOtp}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-700">
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={otp.code}
                onChange={(event: ChangeEvent<HTMLInputElement>) => updateOtp(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                placeholder="000000"
                required
              />
              {expiresAt && (
                <p className="mt-2 text-xs text-slate-500">
                  Code expires at {new Date(expiresAt).toLocaleTimeString()}
                </p>
              )}
              {debugCode && (
                <p className="mt-1 text-xs font-mono text-slate-400">
                  Dev OTP: <span className="font-semibold">{debugCode}</span>
                </p>
              )}
            </div>
            {status.type && (
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
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
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setStatus({ type: null, message: "" });
              }}
              className="flex w-full justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back
            </button>
          </form>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="font-semibold text-slate-900">Need an account?</p>
          <p>
            <Link to="/register" className="font-semibold text-brand hover:text-brand-dark">
              Create one in minutes
            </Link>{" "}
            and complete a subscription whenever you are ready.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
