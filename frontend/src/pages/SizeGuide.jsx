import { Link } from "react-router-dom";
import useStoreSettings from "../useStoreSettings.js";

export default function SizeGuide() {
  const { whatsapp_url, size_chart_url } = useStoreSettings();

  return (
    <div className="size-guide-page">
      <section className="size-guide-hero page">
        <div>
          <p className="eyebrow">Fit & measurements</p>
          <h1>Find the right size<br /><em>with confidence.</em></h1>
        </div>
        <div className="size-guide-intro">
          <p>Measure over a light layer of clothing and compare the measurements with the chart below. If your child is between two sizes, choose the larger size for a more comfortable fit.</p>
          <p className="chart-note">On a phone, tap the chart to open the full-size image.</p>
        </div>
      </section>

      <section className="chart-section page" id="size-guide" aria-labelledby="blazer-chart-title">
        <div className="chart-heading">
          <div><h2 id="blazer-chart-title">Blazer Measurement</h2></div>
          <p>Size, blazer length, body, sleeve, pant size, pant length and waist measurements.</p>
        </div>
        <a className="chart-image-link" href={size_chart_url} target="_blank" rel="noreferrer" aria-label="Open the blazer measurement chart at full size">
          <img src={size_chart_url} alt="Blazer and trouser measurement chart for sizes 16 through 32" loading="lazy" />
        </a>
      </section>

      <section className="size-guide-help">
        <p className="eyebrow">Still unsure?</p>
        <h2>We can help you choose.</h2>
        <p>Send your child's age, height and usual clothing size. Our team will recommend the closest fit.</p>
        <div><a href={whatsapp_url} target="_blank" rel="noreferrer" className="button light">Ask on WhatsApp <span>↗</span></a><Link to="/#collection" className="text-link">View the collection</Link></div>
      </section>
    </div>
  );
}
