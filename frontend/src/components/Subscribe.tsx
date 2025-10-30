import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import type { RazorpayHandlerResponse, RazorpayOptions, RazorpayOrderPayload } from "../types/razorpay";

type StatusState = {
  type: "error" | "success" | null;
  message: string;
};

const Subscribe = () => {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<StatusState>({ type: null, message: "" });
  const [loading, setLoading] = useState<boolean>(false);

  const plans = useMemo(
    () => [
      {
        id: "starter",
        name: "Starter",
        description: "Weekly digest to stay in the loop.",
        amountPaise: 0,
        price: "Rs 0",
        helper: "Join the waitlist to unlock this tier soon.",
        currency: "INR",
        disabled: true
      },
      {
        id: "growth",
        name: "Growth",
        description: "Unlock live dashboards, exports, and automations.",
        amountPaise: 49900,
        price: "Rs 499 / month",
        helper: "Best for trading desks delivering actionable reports.",
        currency: "INR"
      },
      {
        id: "pro",
        name: "Pro Trader",
        description: "Advanced analytics for prop desks and advisory teams.",
        amountPaise: 129900,
        price: "Rs 1,299 / month",
        helper: "Includes strategy backtesting and segmented P&L views.",
        currency: "INR"
      },
      {
        id: "institutional",
        name: "Institutional",
        description: "Multi-entity analytics with custom compliance workflows.",
        amountPaise: 299900,
        price: "Rs 2,999 / month",
        helper: "Enable for multi-account reporting, subject to review.",
        currency: "INR",
        disabled: true
      },
      {
        id: "enterprise",
        name: "Enterprise Plus",
        description: "Tailored deployment with concierge onboarding.",
        amountPaise: 0,
        price: "Custom",
        helper: "Talk to sales for bespoke rollout.",
        currency: "INR",
        disabled: true
      }
    ],
    []
  );

  const preferredPlan = useMemo(() => {
    const saved = localStorage.getItem("preferredPlan");
    return saved ?? "growth";
  }, []);

  const initialPlan = useMemo(() => {
    const guess = plans.find((plan) => plan.id === preferredPlan);
    if (guess && guess.amountPaise > 0) {
      return guess.id;
    }
    return "growth";
  }, [plans, preferredPlan]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlan);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[1];

  useEffect(() => {
    const razorpayLoaded = typeof window !== "undefined" && typeof window.Razorpay !== "undefined";
    if (!razorpayLoaded) {
      setStatus({
        type: "error",
        message: "Razorpay script not loaded. Please refresh and try again."
      });
    }
  }, []);

  const openCheckout = async () => {
    setStatus({ type: null, message: "" });
    setLoading(true);
    try {
      if (selectedPlan.disabled || selectedPlan.amountPaise <= 0) {
        setStatus({ type: "error", message: "Please choose an active paid plan to continue with checkout." });
        return;
      }
      const response = await API.post<RazorpayOrderPayload>("/payment/create-order", {
        amountInPaise: selectedPlan.amountPaise,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        currency: selectedPlan.currency ?? "INR"
      });
      const order = response.data;

      if (typeof window.Razorpay === "undefined") {
        setStatus({
          type: "error",
          message: "Razorpay script not available. Please refresh and try again."
        });
        return;
      }

      const options: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "SVX Intelligence",
        description: `${selectedPlan.name} subscription`,
        notes: { plan: selectedPlan.name },
        order_id: order.orderId,
        handler: async (razorpayResponse: RazorpayHandlerResponse) => {
          const paymentId = razorpayResponse.razorpay_payment_id;
          const orderId = razorpayResponse.razorpay_order_id ?? order.orderId ?? null;
          const signature = razorpayResponse.razorpay_signature ?? null;

          if (!paymentId) {
            setStatus({
              type: "error",
              message: "Missing payment confirmation from Razorpay. Please retry the payment."
            });
            return;
          }

          try {
            await API.post("/payment/verify", {
              orderId,
              paymentId,
              signature
            });
            setStatus({ type: "success", message: "Payment verified. Subscription activated." });
            await refreshUser();
          } catch (error: unknown) {
            const message =
              isAxiosError<{ message?: string }>(error) && error.response?.data?.message
                ? error.response.data.message
                : "Verification failed.";
            setStatus({ type: "error", message });
          }
        },
        prefill: {
          name: user?.name ?? "",
          email: user?.email ?? "",
          contact: user?.phoneNumber ?? ""
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: unknown) {
      const message =
        isAxiosError<{ message?: string }>(error) && error.response?.data?.message
          ? error.response.data.message
          : "Unable to initiate payment. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      await API.post("/payment/cancel");
      setStatus({ type: "success", message: "Subscription cancelled. Access continues until the end of the billing period." });
      await refreshUser();
    } catch (error: unknown) {
      const message =
        isAxiosError<{ message?: string }>(error) && error.response?.data?.message
          ? error.response.data.message
          : "Unable to cancel right now. Please try again.";
      setStatus({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Manage your subscription</h1>
            <p className="mt-2 text-sm text-slate-500">
              Activate the Growth plan to unlock live dashboards, exports, and automation. You can switch or cancel anytime.
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              user?.isSubscribed
                ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
                : "border border-amber-100 bg-amber-50 text-amber-600"
            }`}
          >
            {user?.isSubscribed ? "Active" : "Inactive"}
          </span>
        </div>
        {!user?.isRegistrationComplete && (
          <div className="mt-4 rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Your account is pending activation. Complete payment to enable OTP login and live data access.
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const disabled = plan.disabled ?? plan.amountPaise <= 0;
            const isSelected = plan.id === selectedPlan.id;
            return (
              <button
                key={plan.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  localStorage.setItem("preferredPlan", plan.id);
                }}
                className={`flex h-full flex-col rounded-xl border p-5 text-left transition ${
                  isSelected ? "border-brand bg-brand/5 shadow-sm shadow-brand/20" : "border-slate-200 bg-slate-50 hover:border-brand/40 hover:bg-brand/5"
                } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-slate-900">{plan.name}</p>
                  {isSelected && <span className="text-xs font-semibold uppercase tracking-wide text-brand">Selected</span>}
                </div>
                <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                <p className="mt-6 text-2xl font-bold text-slate-900">{plan.price}</p>
                {plan.helper && <span className="mt-4 text-xs font-medium text-slate-500">{plan.helper}</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold uppercase tracking-wide">Selected plan</span>
            <span className="font-medium text-slate-900">{selectedPlan.name}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold uppercase tracking-wide">Amount</span>
            <span className="text-xl font-semibold text-slate-900">{selectedPlan.price}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span className="font-semibold uppercase tracking-wide">Billing email</span>
            <span className="font-medium text-slate-900">{user?.email ?? "-"}</span>
          </div>
        </div>

        {status.type && (
          <div
            className={`mt-6 rounded-md border px-4 py-3 text-sm ${
              status.type === "error"
                ? "border-rose-100 bg-rose-50 text-rose-600"
                : "border-emerald-100 bg-emerald-50 text-emerald-600"
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={openCheckout}
            disabled={loading}
            className="rounded-md bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-wait disabled:bg-brand/60"
            type="button"
          >
            {user?.isSubscribed ? "Renew subscription" : selectedPlan.disabled || selectedPlan.amountPaise <= 0 ? "Confirm plan" : "Activate subscription"}
          </button>
          {user?.isSubscribed && (
            <button
              onClick={cancelSubscription}
              type="button"
              className="rounded-md border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              disabled={loading}
            >
              Cancel plan
            </button>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">How payment verification works</h2>
        <ol className="mt-3 space-y-3">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">1</span>
            Create an order via our ASP.NET Web API endpoint.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">2</span>
            Complete payment through Razorpay Checkout and receive the payment identifiers.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">3</span>
            SVX verifies the signature, activates your plan, and updates KYC + billing status.
          </li>
        </ol>
        <div className="mt-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p>
            Need automated cancellation or invoicing? Configure the optional Razorpay webhooks so plan status stays in sync when payments change.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Subscribe;
