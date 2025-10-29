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
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="rounded-2xl bg-white p-8 shadow-lg shadow-slate-100">
        <h2 className="text-2xl font-bold text-slate-900">Secure login</h2>
        <p className="mt-2 text-sm text-slate-500">
          Use your registered mobile number to receive a one-time password. Each number supports only one active session.
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
              className="flex w-full justify-center rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:bg-brand/60"
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
              className="flex w-full justify-center rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:bg-brand/60"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setStatus({ type: null, message: "" });
              }}
              className="flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Back
            </button>
          </form>
        )}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        <p>
          Need access?{" "}
          <Link to="/register" className="font-semibold text-brand hover:text-brand-dark">
            Create an account
          </Link>{" "}
          and complete your subscription payment to activate your workspace.
        </p>
      </div>
    </div>
  );
};

export default Login;
