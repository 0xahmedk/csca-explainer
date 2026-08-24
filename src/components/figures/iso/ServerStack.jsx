import { useRef, useState } from "react";
import { useElementWidth } from "../../../hooks/useElementWidth.js";

// Pattern ids have to survive being referenced from url(#...), which rules out
// useId: its output contains characters a CSS url() reference cannot carry.
let patternSeq = 0;

const TENANTS = [
  {
    key: "bank",
    long: "Bank payment service",
    short: "Bank payment",
    solid: true,
  },
  {
    key: "attacker",
    long: "Rented VM, attacker",
    short: "Attacker VM",
    solid: false,
  },
];

/**
 * One physical server, drawn twice over: the same geometry under two different
 * accounts of it. Nothing moves between the views, so the only thing the reader
 * can notice is that the two accounts disagree about what is below the
 * hypervisor.
 */
export function ServerStack({ view }) {
  const boxRef = useRef(null);
  const width = useElementWidth(boxRef, 560);
  const [hatchId] = useState(() => {
    patternSeq += 1;
    return `csca-hatch-${patternSeq}`;
  });
  const shared = view === "shared";

  const narrow = width < 420;
  const pad = narrow ? 6 : 10;
  const gapX = narrow ? 8 : 14;
  const colW = (width - pad * 2 - gapX) / 2;
  const boxPad = 6;
  const titleH = narrow ? 20 : 22;
  const rowH = narrow ? 22 : 26;
  const rowGap = 4;
  const fontTitle = narrow ? 10.5 : 11.5;
  const fontRow = narrow ? 9.5 : 10.5;

  const rows = narrow
    ? ["Guest OS", "Private memory", "Firewall"]
    : ["Guest OS", "Private memory", "Firewalled network"];

  const tenantY = 6;
  const tenantH = boxPad + titleH + rowGap + rowH * 3 + rowGap * 2 + boxPad;
  const hyperY = tenantY + tenantH + (narrow ? 8 : 12);
  const hyperH = narrow ? 26 : 30;
  const cpuY = hyperY + hyperH + (narrow ? 8 : 10);
  const cpuH = narrow ? 72 : 80;
  const height = cpuY + cpuH + 6;

  const cacheH = narrow ? 30 : 34;
  const cacheY = cpuY + cpuH - 8 - cacheH;
  const cacheX = pad + 10;
  const cacheW = width - pad * 2 - 20;

  const colX = (index) => pad + index * (colW + gapX);
  const colMid = (index) => colX(index) + colW / 2;
  const divider = width / 2;

  return (
    <div className="stack" ref={boxRef}>
      <svg
        className="stack__svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          shared
            ? "The same server, showing one physical last level cache below the hypervisor that both tenants reach."
            : "The server as the isolation controls model it: two separate tenants, separated all the way down."
        }
      >
        <defs>
          <pattern
            id={hatchId}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" className="stack__hatch" />
          </pattern>
        </defs>

        {/* the boundary, as the controls draw it */}
        <rect
          x={divider - 0.5}
          y={tenantY}
          width="1"
          height={hyperY + hyperH - tenantY}
          className="stack__divider"
        />

        {/* the two tenants */}
        {TENANTS.map((tenant, index) => (
          <g key={tenant.key}>
            <rect
              x={colX(index)}
              y={tenantY}
              width={colW}
              height={tenantH}
              rx="3"
              className="stack__box"
              style={{ fill: tenant.solid ? "none" : `url(#${hatchId})` }}
            />
            <rect
              x={colX(index) + boxPad}
              y={tenantY + boxPad}
              width={colW - boxPad * 2}
              height={titleH}
              rx="2"
              className={
                tenant.solid ? "stack__title-solid" : "stack__title-outline"
              }
            />
            <text
              x={colMid(index)}
              y={tenantY + boxPad + titleH / 2 + fontTitle * 0.36}
              textAnchor="middle"
              fontSize={fontTitle}
              className={tenant.solid ? "stack__label-inverse" : "stack__label"}
            >
              {narrow ? tenant.short : tenant.long}
            </text>

            {rows.map((row, r) => {
              const y =
                tenantY + boxPad + titleH + rowGap + r * (rowH + rowGap);
              return (
                <g key={row}>
                  <rect
                    x={colX(index) + boxPad}
                    y={y}
                    width={colW - boxPad * 2}
                    height={rowH}
                    rx="2"
                    className="stack__row"
                  />
                  <text
                    x={colMid(index)}
                    y={y + rowH / 2 + fontRow * 0.36}
                    textAnchor="middle"
                    fontSize={fontRow}
                    className="stack__label-muted"
                  >
                    {row}
                  </text>
                </g>
              );
            })}
          </g>
        ))}

        {/* Both tenants reach the same hardware. Drawn behind the hypervisor
            bar, because the path goes below it rather than through it. */}
        <g className={shared ? "stack__links" : "stack__links is-hidden"}>
          {TENANTS.map((tenant, index) => (
            <g key={`link-${tenant.key}`}>
              <line
                x1={colMid(index)}
                y1={tenantY + tenantH}
                x2={colMid(index)}
                y2={cacheY - 6}
                className="stack__link"
              />
              <path
                d={`M${colMid(index) - 3.5} ${cacheY - 6}L${colMid(index) + 3.5} ${cacheY - 6}L${colMid(index)} ${cacheY}Z`}
                className="stack__link-head"
              />
            </g>
          ))}
        </g>

        {/* hypervisor */}
        <rect
          x={pad}
          y={hyperY}
          width={width - pad * 2}
          height={hyperH}
          rx="3"
          className="stack__row stack__row--wide"
        />
        <text
          x={width / 2}
          y={hyperY + hyperH / 2 + fontRow * 0.36}
          textAnchor="middle"
          fontSize={fontRow}
          className="stack__label-muted"
        >
          Hypervisor
        </text>

        {/* the physical machine, dimmed while the controls do the talking */}
        <g className={shared ? "stack__hw" : "stack__hw is-unseen"}>
          <rect
            x={pad}
            y={cpuY}
            width={width - pad * 2}
            height={cpuH}
            rx="3"
            className="stack__box"
          />
          <text
            x={pad + 10}
            y={cpuY + 15}
            fontSize={fontRow}
            className="stack__label-muted"
          >
            Physical CPU
          </text>
          <rect
            x={cacheX}
            y={cacheY}
            width={cacheW}
            height={cacheH}
            rx="2"
            className="stack__cache"
          />
          <text
            x={width / 2}
            y={cacheY + cacheH / 2 + fontTitle * 0.36}
            textAnchor="middle"
            fontSize={fontTitle}
            className="stack__label"
          >
            Shared last level cache
          </text>

          <rect
            x={divider - 0.5}
            y={hyperY + hyperH}
            width="1"
            height={cpuY + cpuH - hyperY - hyperH}
            className={shared ? "stack__divider is-hidden" : "stack__divider"}
          />
        </g>
      </svg>
    </div>
  );
}
