export default function ProductImage({ product, image, eager = false }) {
  const source = image?.url || product.image_url || product.images?.[0]?.url;
  if (source) return <img className="photo" src={source} alt={image?.alt_text || product.name} loading={eager ? "eager" : "lazy"} />;
  return <div className="photo-placeholder" style={{ "--product-color": product.color_hex }} role="img" aria-label={`${product.name} photo coming soon`}><span>Moon Shop BD</span><strong>{product.name}</strong><small>Product photo coming soon</small></div>;
}
