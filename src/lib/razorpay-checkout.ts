interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: () => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => RazorpayInstance;
  }
}

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load payment window"));
    document.body.appendChild(s);
  });
}

export async function openCheckout(opts: {
  keyId: string;
  orderId: string;
  amount: number;
  description: string;
  email?: string;
}): Promise<RazorpayResponse | null> {
  await loadScript();
  return new Promise((resolve) => {
    const rz = new window.Razorpay!({
      key: opts.keyId,
      order_id: opts.orderId,
      amount: opts.amount,
      currency: "INR",
      name: "ManaCaptions",
      description: opts.description,
      prefill: { email: opts.email },
      theme: { color: "#f08a24" },
      handler: (r: RazorpayResponse) => resolve(r),
      modal: { ondismiss: () => resolve(null) },
    });
    rz.open();
  });
}
