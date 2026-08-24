import { useEffect, useId, useRef, useState } from "react";
import avatar from "../assets/ahmed.png";

// PLACEHOLDERS. Swap these three for the real addresses.
const LINKS = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/0xahmedkhan",
    icon: LinkedInIcon,
  },
  { label: "GitHub", href: "https://github.com/0xahmedk", icon: GitHubIcon },
  {
    label: "Publications and portfolio",
    href: "https://0xahmedk.github.io/me",
    icon: LinkIcon,
  },
];

/**
 * Byline that opens a short list of links. Hover reveals it on pointer devices,
 * a tap or a click toggles it everywhere, and focus opens it for the keyboard,
 * so the links are reachable by every route into the page.
 */
export function AuthorBadge({ name = "Ahmed Khan" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const popId = useId();

  // Close on a click elsewhere or on Escape.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`author${open ? " is-open" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="author__trigger"
        aria-expanded={open}
        aria-controls={popId}
        onClick={() => setOpen(!open)}
      >
        <img
          className="author__avatar"
          src={avatar}
          alt=""
          width="40"
          height="40"
        />
        <span className="author__name">{name}</span>
        <svg
          className="author__chevron"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6.5 9.5 5.5 5.5 5.5-5.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="author__pop" id={popId}>
        <ul className="author__links">
          {LINKS.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a href={href} target="_blank" rel="noreferrer noopener">
                <Icon />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9.75h4v10.75H3V9.75Zm6.5 0h3.83v1.47h.06c.53-.95 1.83-1.96 3.77-1.96 4.03 0 4.78 2.5 4.78 5.76v5.48h-4v-4.86c0-1.16-.02-2.65-1.68-2.65-1.68 0-1.94 1.26-1.94 2.57v4.94h-3.98V9.75Z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.5 1.5M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.5-1.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
