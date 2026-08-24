import { ExternalLink } from './ExternalLink.jsx'
import { FigureSlot } from './FigureSlot.jsx'
import { AttackFigure } from './figures/AttackFigure.jsx'
import { GapFigure } from './figures/GapFigure.jsx'
import { IsolationFigure } from './figures/IsolationFigure.jsx'
import { GraphFigure } from './figures/GraphFigure.jsx'
import { ModelPathsFigure } from './figures/ModelPathsFigure.jsx'
import { PipelineFigure } from './figures/PipelineFigure.jsx'
import { ShuffleFigure } from './figures/ShuffleFigure.jsx'
import { ThresholdWidget } from './figures/ThresholdWidget.jsx'

// Figures are registered here so content.js stays plain data.
const FIGURES = {
  isolation: IsolationFigure,
  attack: AttackFigure,
  pipeline: PipelineFigure,
  gap: GapFigure,
  threshold: ThresholdWidget,
  shuffle: ShuffleFigure,
  paths: ModelPathsFigure,
  graph: GraphFigure,
}

const CITE = /\[\[(\d+)\]\]/g

function withCitations(text) {
  const parts = []
  let last = 0
  for (const match of text.matchAll(CITE)) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    parts.push(
      <a className="cite" href={`#ref-${match[1]}`} key={match.index}>
        [{match[1]}]
      </a>,
    )
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : text
}

function References({ entries, tools }) {
  return (
    <>
      <ol className="biblio">
        {entries.map((entry) => (
          <li className="biblio__item" id={`ref-${entry.number}`} key={entry.number}>
            <span className="biblio__num">[{entry.number}]</span>
            <div className="biblio__body">
              <p className="biblio__cite">
                {entry.href ? (
                  <ExternalLink href={entry.href}>{entry.citation}</ExternalLink>
                ) : (
                  entry.citation
                )}
              </p>
              <p className="biblio__role">{entry.role}</p>
            </div>
          </li>
        ))}
      </ol>

      {tools && (
        <div className="tools">
          <h3 className="tools__title">{tools.title}</h3>
          <ul className="tools__list">
            {tools.items.map((item) => (
              <li key={item.name}>
                {item.href ? (
                  <ExternalLink href={item.href}>{item.name}</ExternalLink>
                ) : (
                  <span className="tools__name">{item.name}</span>
                )}
                <span className="tools__detail">{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function Prose({ paragraphs }) {
  return (
    <div className="section__body section__after">
      {paragraphs.map((text) => (
        <p key={text.slice(0, 40)}>{withCitations(text)}</p>
      ))}
    </div>
  )
}

function ComparisonTable({ table }) {
  return (
    <table className="cmp">
      <caption className="cmp__caption">{table.title}</caption>
      <thead>
        <tr>
          {table.columns.map((column, columnIndex) => (
            <th key={column || columnIndex} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row[0]}>
            <th scope="row">{row[0]}</th>
            {row.slice(1).map((cell, cellIndex) => (
              <td key={cell} data-label={table.columns[cellIndex + 1]}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Spec({ title, items }) {
  return (
    <div className="spec">
      <h3 className="spec__title">{title}</h3>
      <dl className="spec__list">
        {items.map((item) => (
          <div className="spec__item" key={item.term}>
            <dt>{item.term}</dt>
            <dd>{withCitations(item.detail)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Ranked({ title, note, items }) {
  return (
    <div className="ranked">
      <h3 className="ranked__title">{title}</h3>
      <ol className="ranked__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      {note && <p className="ranked__note">{note}</p>}
    </div>
  )
}

function Sources({ title, entries }) {
  return (
    <div className="sources">
      <h3 className="sources__title">{title}</h3>
      <ol className="sources__list">
        {entries.map((entry) => (
          <li key={entry.title} className="sources__item">
            <p className="sources__head">
              {entry.href ? (
                <ExternalLink href={entry.href}>{entry.title}</ExternalLink>
              ) : (
                entry.title
              )}
              <span className="sources__meta">{entry.meta}</span>
              {entry.ref && (
                <a className="cite" href={`#ref-${entry.ref}`}>
                  [{entry.ref}]
                </a>
              )}
            </p>
            <p className="sources__text">{withCitations(entry.text)}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Blocks({ blocks }) {
  return blocks.map((block, order) => {
    const key = `${block.type}-${block.label ?? block.title ?? order}`

    if (block.type === 'figure') {
      const Component = FIGURES[block.component]
      if (!Component) return null
      return block.wide ? (
        <div className="section__figure" key={key}>
          <Component label={block.label} caption={block.caption} />
        </div>
      ) : (
        <div className="measure section__aside" key={key}>
          <Component label={block.label} caption={block.caption} />
        </div>
      )
    }

    return (
      <div className="measure" key={key}>
        {block.type === 'prose' && <Prose paragraphs={block.paragraphs} />}
        {block.type === 'spec' && <Spec title={block.title} items={block.items} />}
        {block.type === 'ranked' && (
          <Ranked title={block.title} note={block.note} items={block.items} />
        )}
        {block.type === 'sources' && <Sources title={block.title} entries={block.entries} />}
      </div>
    )
  })
}

export function Section({ section, index }) {
  const number = String(index + 1).padStart(2, '0')
  const Figure = section.figure?.component ? FIGURES[section.figure.component] : null
  const Aside = section.aside?.component ? FIGURES[section.aside.component] : null

  return (
    <section id={section.id} className="section" aria-labelledby={`${section.id}-heading`}>
      <div className="measure">
        <p className="section__number">{number}</p>
        <h2 className="section__heading" id={`${section.id}-heading`}>
          {section.heading}
        </h2>

        <div className="section__body">
          {section.paragraphs?.map((text) => (
            <p key={text.slice(0, 40)}>{withCitations(text)}</p>
          ))}

          {section.references && (
            <References entries={section.references} tools={section.tools} />
          )}
        </div>
      </div>

      {section.figure && (
        <div className="section__figure">
          {Figure ? (
            <Figure label={section.figure.label} caption={section.figure.caption} />
          ) : (
            <FigureSlot {...section.figure} />
          )}
        </div>
      )}

      {section.table && (
        <div className="measure">
          <ComparisonTable table={section.table} />
        </div>
      )}

      {section.afterFigure && (
        <div className="measure">
          <Prose paragraphs={section.afterFigure} />
        </div>
      )}

      {Aside &&
        (section.aside.wide ? (
          <div className="section__figure">
            <Aside label={section.aside.label} caption={section.aside.caption} />
          </div>
        ) : (
          <div className="measure section__aside">
            <Aside label={section.aside.label} caption={section.aside.caption} />
          </div>
        ))}

      {section.closing && (
        <div className="measure">
          <Prose paragraphs={section.closing} />
        </div>
      )}

      {section.spec && (
        <div className="measure">
          <Spec title={section.spec.title} items={section.spec.items} />
        </div>
      )}

      {section.notes && (
        <div className="measure">
          <Prose paragraphs={section.notes} />
        </div>
      )}

      {section.sources && (
        <div className="measure">
          <Sources title={section.sources.title} entries={section.sources.entries} />
        </div>
      )}

      {section.blocks && <Blocks blocks={section.blocks} />}

      {section.legend && (
        <div className="measure">
          <ul className="legend">
            <li className="legend__item">
              <span className="legend__swatch legend__swatch--attack" aria-hidden="true" />
              Attack
            </li>
            <li className="legend__item">
              <span className="legend__swatch legend__swatch--benign" aria-hidden="true" />
              Benign
            </li>
          </ul>
        </div>
      )}
    </section>
  )
}
