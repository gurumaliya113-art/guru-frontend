// Razorpay Standard Checkout helper.
//
// Razorpay ships its checkout SDK as a global `window.Razorpay` constructor
// loaded from https://checkout.razorpay.com/v1/checkout.js. We lazy-load
// the script on first use so unauthenticated / non-paying pages never pay
// the network/JS cost.
//
// Flow consumed by `startSubscriptionCheckout`:
//   1. Hit /api/payments/create-order to get { orderId, amount, currency, keyId }.
//   2. new window.Razorpay({...}).open() — user pays.
//   3. On the `handler` callback we POST the returned ids to /api/payments/verify
//      which checks the HMAC signature and flips profile.subscription on the server.
//   4. We refresh the profile in AppContext so the UI immediately reflects "unlocked".

import { api } from "@/lib/api";

type RzpResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const SDK_URL = "https://checkout.razorpay.com/v1/checkout.js";
let sdkPromise: Promise<void> | null = null;

function loadRazorpaySdk(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      sdkPromise = null;
      reject(new Error("Failed to load Razorpay SDK"));
    };
    document.body.appendChild(s);
  });
  return sdkPromise;
}

export type CheckoutContext = {
  name: string;     // displayed in the checkout modal
  email?: string;
  phone?: string;
};

export type SubscriptionResult = {
  active: boolean;
  plan?: string;
  validUntil?: string;
  razorpayPaymentId?: string;
};

export async function startSubscriptionCheckout(
  ctx: CheckoutContext,
  onSuccess: (sub: SubscriptionResult) => void | Promise<void>,
  onFailure?: (err: Error) => void,
  options?: { planId?: string; planLabel?: string },
): Promise<void> {
  try {
    await loadRazorpaySdk();
    if (!window.Razorpay) throw new Error("Razorpay SDK not available");

    const order = await api.createPaymentOrder(options?.planId);

    const description = options?.planLabel
      ? `${options.planLabel} · all PYP papers & analytics`
      : "Subscription · all PYP papers & analytics";

    const rzpOptions = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "Gurutron",
      description,
      order_id: order.orderId,
      prefill: {
        name: ctx.name,
        email: ctx.email || "",
        contact: ctx.phone || "",
      },
      theme: { color: "#2563eb" },
      handler: async (resp: RzpResponse) => {
        try {
          const verified = await api.verifyPayment({
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
            plan: options?.planId,
          });
          await onSuccess(verified.subscription);
        } catch (e) {
          onFailure?.(e as Error);
        }
      },
      modal: {
        ondismiss: () => {
          // User closed the popup without paying — nothing to do, just log.
          console.info("[razorpay] checkout dismissed by user");
        },
      },
    };

    const rzp = new window.Razorpay(rzpOptions);
    rzp.open();
  } catch (e) {
    onFailure?.(e as Error);
  }
}
