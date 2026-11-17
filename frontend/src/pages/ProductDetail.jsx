import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createOrder, getProduct } from "../api.js";
import ProductImage from "../components/ProductImage.jsx";
import SizeGuideModal from "../components/SizeGuideModal.jsx";
import { formatPrice } from "../config.js";
import { trackMetaEvent } from "../metaPixel.js";
import useStoreSettings from "../useStoreSettings.js";

const EMPTY_FORM = { customer_name: "", phone: "", email: "", address: "", city: "", note: "", delivery_area: "" };

export default function ProductDetail() {
  const { helpline_number, whatsapp_url, size_chart_url, delivery_inside_dhaka, delivery_outside_dhaka } = useStoreSettings();
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const trackedProduct = useRef("");
  const checkoutStarted = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setProduct(null); setLoadError(""); setActiveImage(0);
    getProduct(slug).then(setProduct).catch((e) => setLoadError(e.message));
  }, [slug]);

  useEffect(() => {
    if (!product || trackedProduct.current === product.slug) return;

    trackedProduct.current = product.slug;
    trackMetaEvent("ViewContent", {
      content_ids: [product.slug],
      content_name: product.name,
      content_type: "product",
      value: Number(product.price),
      currency: "BDT",
    });
  }, [product]);

  const setField = (name) => (e) => setForm((current) => ({ ...current, [name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault(); setFormError("");
    if (!size) { setErrors({ size: "Please select your size." }); setFormError("Please check the highlighted field."); return; }
    if (!form.delivery_area) { setErrors({ delivery_area: "Please choose a delivery area." }); setFormError("Please check the highlighted field."); return; }
    if (!checkoutStarted.current) {
      checkoutStarted.current = true;
      trackMetaEvent("InitiateCheckout", {
        content_ids: [product.slug],
        contents: [{ id: product.slug, quantity: Number(quantity), item_price: Number(product.price) }],
        content_type: "product",
        value: Number(product.price) * Number(quantity),
        currency: "BDT",
        num_items: Number(quantity),
      });
    }
    setErrors({}); setSubmitting(true);
    try {
      const order = await createOrder({ product: product.slug, size, quantity: Number(quantity), ...form });
      trackMetaEvent("Purchase", {
        content_ids: [product.slug],
        contents: [{ id: product.slug, quantity: Number(order.quantity), item_price: Number(order.unit_price) }],
        content_name: product.name,
        content_type: "product",
        value: Number(order.total),
        currency: "BDT",
        num_items: Number(order.quantity),
        order_id: String(order.id),
      });
      setPlaced(order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    catch (err) { setErrors(err.fieldErrors || {}); setFormError(err.message); }
    finally { setSubmitting(false); }
  }

  if (loadError) return <div className="page narrow empty-state"><p className="notice error" role="alert">{loadError}</p><Link to="/" className="button">Return to the collection</Link></div>;
  if (!product) return <div className="page detail-loading">Preparing your selection…</div>;

  if (placed) return (
    <div className="page narrow confirmation" aria-live="polite">
      <span className="confirmation-mark">✓</span><p className="eyebrow">Order received</p><h1>Thank you, {placed.customer_name}.</h1>
      <p>We received order <strong>#{placed.id}</strong>. We will call <strong>{placed.phone}</strong> to confirm it before delivery.</p>
      <dl className="summary"><div><dt>Piece</dt><dd>{product.name}</dd></div><div><dt>Size</dt><dd>{placed.size}</dd></div><div><dt>Quantity</dt><dd>{placed.quantity}</dd></div><div><dt>Delivery</dt><dd>{placed.delivery_area === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka"} · {formatPrice(placed.delivery_fee)}</dd></div><div><dt>Total</dt><dd>{formatPrice(placed.total)}</dd></div></dl>
      <div className="confirmation-actions"><Link to="/" className="button">Continue shopping</Link><a href={whatsapp_url} target="_blank" rel="noreferrer" className="text-link">Message us ↗</a></div>
    </div>
  );

  const images = product.images || [];
  const subtotal = Number(product.price) * Number(quantity || 1);
  const deliveryFee = form.delivery_area === "inside_dhaka" ? Number(delivery_inside_dhaka) : form.delivery_area === "outside_dhaka" ? Number(delivery_outside_dhaka) : 0;
  const total = subtotal + deliveryFee;
  return (
    <div className="product-page">
      <div className="product-breadcrumb page"><Link to="/">Home</Link><span>/</span><Link to="/#collection">Collection</Link><span>/</span><span>{product.name}</span></div>
      <div className="detail page">
        <section className="detail-gallery" aria-label={`${product.name} gallery`}>
          <div className="gallery-main"><ProductImage product={product} image={images[activeImage]} eager /><span className="image-count">{String(activeImage + 1).padStart(2, "0")} / {String(Math.max(images.length, 1)).padStart(2, "0")}</span></div>
          {images.length > 1 && <div className="gallery-thumbs">{images.map((image, index) => <button type="button" key={image.id} className={activeImage === index ? "active" : ""} onClick={() => setActiveImage(index)} aria-label={`View image ${index + 1}`}><ProductImage product={product} image={image} /></button>)}</div>}
        </section>
        <section className="detail-info">
          <p className="eyebrow">Kids' blazer · Ages 1–12</p><h1>{product.name}</h1><p className="price detail-price">{formatPrice(product.price)}</p>
          <p className="description">{product.description}</p>
          <div className="product-specs"><div><span>Fabric</span><strong>{product.material || "Comfortable fabric blend"}</strong></div><div><span>Fit</span><strong>{product.fit || "Comfortable kids' fit"}</strong></div></div>
          <form onSubmit={onSubmit} noValidate id="order-form">
            <fieldset className="field-group"><div className="legend-row"><legend>Select your size</legend><button type="button" className="size-guide-trigger" onClick={() => setSizeGuideOpen(true)}>View size guide</button></div><div className="sizes">{product.sizes.map((item) => <label key={item} className={`size ${size === item ? "selected" : ""}`}><input type="radio" name="size" value={item} checked={size === item} onChange={() => setSize(item)} /><span>{item}</span></label>)}</div>{errors.size && <p className="field-error" role="alert">{errors.size}</p>}</fieldset>
            <div className="delivery-heading"><p className="eyebrow">Delivery details</p><h2>Enter your information</h2><p>Pay with cash on delivery. Questions? Call {helpline_number}.</p></div>
            <div className={`field ${errors.delivery_area ? "has-error" : ""}`}><label htmlFor="delivery_area">Where to deliver *</label><select id="delivery_area" name="delivery_area" value={form.delivery_area} onChange={setField("delivery_area")} aria-invalid={errors.delivery_area ? "true" : undefined} aria-describedby={errors.delivery_area ? "delivery_area-err" : undefined} required><option value="">Choose a delivery area</option><option value="inside_dhaka">Inside Dhaka · {formatPrice(delivery_inside_dhaka)}</option><option value="outside_dhaka">Outside Dhaka · {formatPrice(delivery_outside_dhaka)}</option></select>{errors.delivery_area && <p className="field-error" id="delivery_area-err" role="alert">{errors.delivery_area}</p>}</div>
            <div className="order-bar"><label htmlFor="quantity">Qty<select id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)}>{[1,2,3,4,5].map((n) => <option key={n}>{n}</option>)}</select></label><div><span>{form.delivery_area ? "Total including delivery" : "Subtotal before delivery"}</span><strong>{formatPrice(total)}</strong></div></div>
            <div className="field-pair"><Field id="customer_name" label="Full name" value={form.customer_name} onChange={setField("customer_name")} error={errors.customer_name} autoComplete="name" required /><Field id="phone" label="Phone number" type="tel" value={form.phone} onChange={setField("phone")} error={errors.phone} autoComplete="tel" placeholder="01700 000000" required /></div>
            <Field id="email" label="Email address (optional)" type="email" value={form.email} onChange={setField("email")} error={errors.email} autoComplete="email" />
            <Field id="address" label="Delivery address" as="textarea" rows={3} value={form.address} onChange={setField("address")} error={errors.address} autoComplete="street-address" required />
            <div className="field-pair"><Field id="city" label="City" value={form.city} onChange={setField("city")} error={errors.city} autoComplete="address-level2" required /><Field id="note" label="Order note (optional)" value={form.note} onChange={setField("note")} error={errors.note} /></div>
            {errors.product && <p className="field-error" role="alert">{errors.product}</p>}{formError && <p className="notice error" role="alert">{formError}</p>}
            <button type="submit" className="button order-button" disabled={submitting}>{submitting ? "Placing your order…" : `Place order · ${formatPrice(total)}`}<span>→</span></button><p className="privacy-note">We will only use your details to confirm and deliver this order.</p>
          </form>
          <div className="detail-accordions">
            <details open><summary>Product details <span>+</span></summary><p>{product.details || "A smart kids' blazer with a comfortable fit for special occasions."}</p></details>
            <details><summary>Care <span>+</span></summary><p>{product.care || "Specialist dry clean only. Store on a shaped hanger and allow the fabric to rest between wears."}</p></details>
            <details><summary>Delivery & size exchange <span>+</span></summary><p>Inside Dhaka: {formatPrice(delivery_inside_dhaka)}. Outside Dhaka: {formatPrice(delivery_outside_dhaka)}. Contact us within three days if you need a different size.</p></details>
          </div>
        </section>
      </div>
      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} imageUrl={size_chart_url} />
    </div>
  );
}

function Field({ id, label, error, as = "input", required, ...rest }) {
  const Tag = as;
  return <div className={`field ${error ? "has-error" : ""}`}><label htmlFor={id}>{label}{required && " *"}</label><Tag id={id} name={id} required={required} aria-invalid={error ? "true" : undefined} aria-describedby={error ? `${id}-err` : undefined} {...rest} />{error && <p className="field-error" id={`${id}-err`} role="alert">{error}</p>}</div>;
}
