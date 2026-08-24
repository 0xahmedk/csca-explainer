/**
 * Placeholder for a figure that will later be hand-built SVG or canvas.
 * Present now only so the document's rhythm is visible.
 */
export function FigureSlot({ label, hint, caption }) {
  return (
    <figure className="figure">
      <div className="figure__slot">
        <span className="figure__label">{label}</span>
        <span className="figure__hint">{hint}</span>
      </div>
      <figcaption className="figure__caption">{caption}</figcaption>
    </figure>
  )
}
