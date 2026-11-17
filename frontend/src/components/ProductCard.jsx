import { Link } from "react-router-dom";
import ProductImage from "./ProductImage.jsx";
import { formatPrice } from "../config.js";

export default function ProductCard({ product, index = 0 }) {
  return (
    <article className="product-card" style={{ "--delay": `${index * 70}ms` }}>
      <Link to={`/blazers/${product.slug}`} className="card-link" aria-label={`${product.name}, ${formatPrice(product.price)}. Order now`}>
        <div className="card-media">
          {index === 0 && <span className="card-badge">Popular</span>}
          <ProductImage product={product} />
          <span className="quick-view">Order now <b>→</b></span>
        </div>
        <div className="card-body">
          <div><p className="card-kicker">{product.fit || "Kids' blazer"}</p><h3>{product.name}</h3><span className="card-order">Order now →</span></div>
          <p className="price">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </article>
  );
}
