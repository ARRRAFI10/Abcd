// Stand-in for a product photo: a swatch of the cloth with a jacket outline.
// Disappears automatically once a real photo is uploaded in the admin.
export default function Fabric({ color, pattern, label }) {
  return (
    <div className={`fabric fabric-${pattern}`} style={{ "--cloth": color }} role="img" aria-label={label}>
      <svg viewBox="0 0 120 150" aria-hidden="true">
        <path d="M34 14 L52 8 L60 40 L68 8 L86 14 L112 142 L8 142 Z" className="jacket-body" />
        <path d="M52 8 L60 40 L68 8" className="jacket-lapel" />
        <path d="M60 40 L60 142" className="jacket-line" />
        <circle cx="64" cy="82" r="1.6" className="jacket-button" />
        <circle cx="64" cy="100" r="1.6" className="jacket-button" />
      </svg>
    </div>
  );
}
