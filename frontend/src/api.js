const BASE = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD
  ? "https://arrrafi10-moon-shop-api.onrender.com/api"
  : "/api")).replace(/\/+$/, "");

async function request(path, options) {
  let res;
  try {
    res = await fetch(BASE + path, options);
  } catch {
    throw { message: "Can't reach the server. Check your connection and try again.", fieldErrors: {} };
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const fieldErrors = {};
    let message = "Something went wrong. Please try again.";
    if (res.status === 429) {
      message = "Too many orders from this connection. Please try again later.";
    } else if (res.status === 404) {
      message = "We couldn't find that item.";
    } else if (data && typeof data === "object") {
      for (const [key, value] of Object.entries(data)) {
        fieldErrors[key] = Array.isArray(value) ? value.join(" ") : String(value);
      }
      if (Object.keys(fieldErrors).length) message = "Please fix the highlighted fields.";
    }
    throw { message, fieldErrors, status: res.status };
  }
  return data;
}

export const getProducts = () => request("/products/");
export const getProduct = (slug) => request(`/products/${encodeURIComponent(slug)}/`);
export const getStoreSettings = () => request("/store-settings/");
export const createOrder = (payload) =>
  request("/orders/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
