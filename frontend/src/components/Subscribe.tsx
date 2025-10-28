import { useEffect, useState } from "react";
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

  useEffect(() => {
    const razorpayLoaded = typeof window !== "undefined" && typeof window.Razorpay !== "undefined";
    if (!razorpayLoaded) {
      setStatus({
        type: "error",
        message: "Razorpay script not loaded. Please check network connectivity."
      });
    }
  }, []);

  const openCheckout = async () => {
    setStatus({ type: null, message: "" });
    setLoading(true);
    try {
      const response = await API.post<RazorpayOrderPayload>("/payment/create-order", {});
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
        name: "Subscription Access",
        description: "Full access subscription",
        order_id: order.orderId,
        handler: async (razorpayResponse: RazorpayHandlerResponse) => {
          try {
            await API.post("/payment/verify", {
              orderId: razorpayResponse.razorpay_order_id,
              paymentId: razorpayResponse.razorpay_payment_id,
              signature: razorpayResponse.razorpay_signature
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
          name: user?.name ?? null,
          email: user?.email ?? null
        },
        theme: {
          color: "#2563eb"
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: unknown) {
      const message =
        isAxiosError<{ message?: string }>(error) && error.response?.data?.message
          ? error.response.data.message
          : "Unable to initiate payment.";
      setStatus({ type: "error", message });
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setStatus({ type: "error", message: "Razorpay cancellation via webhook is pending implementation." });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <section className="rounded-2xl bg-white p-8 shadow-lg shadow-slate-100">
        <h2 className="text-3xl font-semibold text-slate-900">Subscription Dashboard</h2>
        <p className="mt-2 text-slate-500">
          Secure payments powered by Razorpay. Your access is automatically activated after payment verification.
        </p>

        <div className="mt-8 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Plan</span>
            <span className="text-sm font-medium text-slate-600">Premium Monthly</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Amount</span>
            <span className="text-2xl font-bold text-slate-900">₹499</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-500">Status</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                user?.isSubscribed
                  ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
                  : "border border-amber-100 bg-amber-50 text-amber-600"
              }`}
            >
              {user?.isSubscribed ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {status.type && (
          <div
            className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
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
            className="rounded-lg bg-brand px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-wait disabled:bg-brand/60"
            type="button"
          >
            {user?.isSubscribed ? "Renew Subscription" : "Activate Subscription"}
          </button>
          {user?.isSubscribed && (
            <button
              onClick={cancelSubscription}
              type="button"
              className="rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancel Plan
            </button>
          )}
        </div>
      </section>

      <aside className="rounded-2xl bg-white p-7 shadow-lg shadow-slate-100">
        <h3 className="text-lg font-semibold text-slate-900">How payment verification works</h3>
        <ol className="mt-4 space-y-4 text-sm text-slate-600">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              1
            </span>
            Create an order via the secure ASP.NET Web API endpoint.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              2
            </span>
            Launch Razorpay Checkout. After payment success, receive payment identifiers.
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              3
            </span>
            API verifies the HMAC signature and persists subscription status.
          </li>
        </ol>
        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-sm text-slate-600">
            Need automated cancellation when subscriptions lapse? Configure the optional Razorpay webhook endpoint to
            reconcile plan state based on Razorpay events.
          </p>
        </div>
      </aside>
    </div>
  );
};

export default Subscribe;
