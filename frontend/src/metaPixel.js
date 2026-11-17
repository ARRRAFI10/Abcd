const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "1242084508126895";

let initialized = false;
let lastPageView = { location: "", timestamp: 0 };

export function initMetaPixel() {
  if (initialized || !META_PIXEL_ID || typeof window === "undefined") return;

  const fbq = window.fbq || function (...args) {
    fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
  };

  if (!window.fbq) {
    window.fbq = fbq;
    window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  window.fbq("init", META_PIXEL_ID);
  initialized = true;
}

export function trackMetaEvent(eventName, parameters = {}) {
  initMetaPixel();
  window.fbq?.("track", eventName, parameters);
}

export function trackPageView(location) {
  const now = Date.now();

  // React StrictMode repeats effects in development. Ignore only the immediate
  // duplicate while still allowing a genuine return to the same page later.
  if (lastPageView.location === location && now - lastPageView.timestamp < 500) return;

  lastPageView = { location, timestamp: now };
  trackMetaEvent("PageView");
}
