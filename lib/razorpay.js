/**
 * Helper to dynamically load the Razorpay Checkout SDK script
 * in Next.js client-side components.
 */
export const loadRazorpayCheckoutScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout script.");
      resolve(false);
    };

    document.body.appendChild(script);
  });
};
