export const STORE_NAME = "Moon Shop BD";
export const CONTACT_PHONE = "+8801700000000";
export const CONTACT_EMAIL = "support@moonshopbd.com";
export const DEFAULT_SIZE_CHART_URL = "/moonsbd-size-chart.jpeg";
export function buildWhatsAppUrl(phone = CONTACT_PHONE) {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent("Hello Moon Shop BD, I need help choosing a kids' blazer.")}`;
}
export const WHATSAPP_URL = buildWhatsAppUrl();

export function formatPrice(value) {
  return "৳" + Number(value).toLocaleString("en-BD", { maximumFractionDigits: 0 });
}
