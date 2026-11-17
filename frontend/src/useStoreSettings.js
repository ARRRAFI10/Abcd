import { useEffect, useState } from "react";
import { getStoreSettings } from "./api.js";
import { buildWhatsAppUrl, CONTACT_EMAIL, CONTACT_PHONE, DEFAULT_SIZE_CHART_URL } from "./config.js";

const FALLBACK = {
  helpline_number: CONTACT_PHONE,
  support_email: CONTACT_EMAIL,
  size_chart_url: DEFAULT_SIZE_CHART_URL,
  delivery_inside_dhaka: "80.00",
  delivery_outside_dhaka: "150.00",
  whatsapp_url: buildWhatsAppUrl(CONTACT_PHONE),
};

export default function useStoreSettings() {
  const [settings, setSettings] = useState(FALLBACK);

  useEffect(() => {
    getStoreSettings().then((data) => setSettings({
      ...data,
      size_chart_url: data.size_chart_url || DEFAULT_SIZE_CHART_URL,
      whatsapp_url: buildWhatsAppUrl(data.helpline_number || CONTACT_PHONE),
    })).catch(() => {});
  }, []);

  return settings;
}
