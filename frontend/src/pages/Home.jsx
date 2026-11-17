import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getProducts } from "../api.js";
import ProductCard from "../components/ProductCard.jsx";
import useStoreSettings from "../useStoreSettings.js";

export default function Home() {
  const { helpline_number, whatsapp_url, size_chart_url } = useStoreSettings();
  const { hash } = useLocation();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { getProducts().then(setProducts).catch((e) => setError(e.message)); }, []);

  useEffect(() => {
    if (!hash || (products === null && !error)) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hash, products, error]);

  return (
    <>
      <section className="hero page">
        <div className="hero-visual">
          <img className="hero-image" src="/kids-blazer-hero.png" alt="Four boys wearing colourful formal suits beside a classic car" fetchPriority="high" />
        </div>
        <div className="hero-copy">
          <div className="hero-message"><p className="eyebrow">Kids' blazers · Ages 1–12</p><h1>Smart blazers made for <em>kids.</em></h1><p className="hero-lede">Comfortable styles for weddings, birthdays, school events and family occasions.</p></div>
          <div className="hero-shop"><div className="hero-actions"><a href="#collection" className="button">Shop kids' blazers <span>→</span></a><a href={whatsapp_url} target="_blank" rel="noreferrer" className="text-link">Ask about size →</a></div><div className="hero-note"><span>✓</span><p>Cash on delivery<br />Easy size exchange</p></div></div>
        </div>
      </section>
      <section className="collection page" id="collection">
        <div className="section-heading"><div><p className="eyebrow">Available now</p><h2>Shop kids' <em>blazers.</em></h2></div><p>Choose a style to select the size and place your order.</p></div>
        {error && <p className="notice error" role="alert">{error}</p>}
        {!products && !error && <div className="loading">Preparing the collection…</div>}
        {products?.length === 0 && <p className="muted">Our next collection is being prepared.</p>}
        {products?.length > 0 && <div className="product-grid">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>}
      </section>
      <section className="landing-size-guide page" aria-labelledby="landing-size-title">
        <div className="section-heading"><div><p className="eyebrow">Fit & measurements</p><h2 id="landing-size-title">Choose the right size<br /><em>before ordering.</em></h2></div><p>Compare your child's measurements with the chart below. If your child is between two sizes, choose the larger size for a more comfortable fit.</p></div>
        <div className="landing-charts">
          <figure id="size-guide" aria-labelledby="blazer-measurement-title">
            <figcaption><strong id="blazer-measurement-title">Blazer Measurement</strong></figcaption>
            <a className="chart-image-link" href={size_chart_url} target="_blank" rel="noreferrer" aria-label="Open the blazer measurement chart at full size"><img src={size_chart_url} alt="Blazer and trouser measurement chart for sizes 16 through 32" loading="lazy" /></a>
          </figure>
        </div>
        <p className="chart-tap-note">Tap the chart to open the full-size image. Need help? <a href={whatsapp_url} target="_blank" rel="noreferrer">Ask us on WhatsApp ↗</a></p>
      </section>
      <section className="atelier" id="why-us">
        <div className="atelier-art"><span>Made for</span><strong>KIDS</strong><span>Ages 1–12</span></div>
        <div className="atelier-copy"><p className="eyebrow">Why parents choose us</p><h2>Smart look.<br /><em>Comfortable fit.</em></h2><p>Our kids' blazers are made for special days without making children feel restricted. We keep the ordering process simple and help parents choose the right size before delivery.</p><div className="signature">Moon Shop BD <span>— Kids' clothing</span></div></div>
      </section>
      <section className="service page" id="service">
        <div className="service-intro"><p className="eyebrow">How we help</p><h2>Simple ordering and<br /><em>friendly support.</em></h2></div>
        <div className="service-grid">
          <article><span>01</span><h3>Choose a blazer</h3><p>View the product photos and details, then choose the design you like.</p><a href="#collection">View the collection ↗</a></article>
          <article id="sizing"><span>02</span><h3>Select the size</h3><p>Compare your child's measurements with our blazer measurement chart before ordering.</p><a href="#size-guide">Open the size guide ↗</a></article>
          <article><span>03</span><h3>Pay on delivery</h3><p>We confirm the order by phone and send it to your address. Easy size exchange is available.</p><a href={`tel:${helpline_number}`}>Call {helpline_number} ↗</a></article>
        </div>
      </section>
      <section className="closing-cta" id="contact"><p className="eyebrow">Need help?</p><h2>Not sure about the size?</h2><p>Send us your child's age and measurements. We will help you choose.</p><a href={whatsapp_url} target="_blank" rel="noreferrer" className="button light">Chat on WhatsApp <span>↗</span></a></section>
    </>
  );
}
