import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import SizeGuide from "./pages/SizeGuide.jsx";
import { STORE_NAME } from "./config.js";
import { trackMetaEvent, trackPageView } from "./metaPixel.js";
import useStoreSettings from "./useStoreSettings.js";

function Mark() {
  return <span className="brand-mark" aria-hidden="true">M</span>;
}

function ScrollToHash() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const timer = window.setTimeout(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname, hash, key]);

  return null;
}

function MetaPixelTracking() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    trackPageView(`${pathname}${search}`);
  }, [pathname, search]);

  useEffect(() => {
    const trackWhatsAppClick = (event) => {
      const link = event.target.closest?.("a");
      const href = link?.href || "";

      if (href.includes("wa.me/") || href.includes("whatsapp.com/")) {
        trackMetaEvent("Contact", { contact_method: "WhatsApp" });
      }
    };

    document.addEventListener("click", trackWhatsAppClick);
    return () => document.removeEventListener("click", trackWhatsAppClick);
  }, []);

  return null;
}

export default function App() {
  const { helpline_number, support_email, whatsapp_url } = useStoreSettings();
  return (
    <>
      <ScrollToHash />
      <MetaPixelTracking />
      <div className="announcement">Cash on delivery available across Bangladesh</div>
      <header className="site-header">
        <Link to="/" className="wordmark"><span className="header-logo"><img src="/moonsbd-arch-logo.png" alt={`${STORE_NAME} — Women & Children's Clothing`} /></span></Link>
        <nav aria-label="Main navigation">
          <Link to="/#collection">Collection</Link>
          <Link to="/#why-us">Why choose us</Link>
          <Link to="/#size-guide">Size guide</Link>
          <Link to="/#contact">Contact</Link>
        </nav>
        <a className="header-cta" href={whatsapp_url} target="_blank" rel="noreferrer">Chat on WhatsApp <span>↗</span></a>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blazers/:slug" element={<ProductDetail />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="*" element={<div className="page narrow empty-state"><p className="eyebrow">404</p><h1>This page has moved.</h1><Link to="/" className="button">Return home</Link></div>} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="footer-main">
          <div><Link to="/" className="footer-brand"><Mark />{STORE_NAME}</Link><p>Smart and comfortable blazers for kids.<br />Delivery available across Bangladesh.</p></div>
          <div><span className="footer-label">Helpline</span><p>Dhaka, Bangladesh<br /><a href={`tel:${helpline_number}`}>{helpline_number}</a><br /><a href={`mailto:${support_email}`}>{support_email}</a></p></div>
          <div><span className="footer-label">Customer help</span><a href={whatsapp_url} target="_blank" rel="noreferrer">WhatsApp support</a><Link to="/#size-guide">Size guide</Link><Link to="/#service">Delivery & exchange</Link></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} {STORE_NAME}</span><span>Kids' fashion in Bangladesh</span></div>
      </footer>
      <a className="whatsapp-float" href={whatsapp_url} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp"><span>◌</span> Need help?</a>
    </>
  );
}
