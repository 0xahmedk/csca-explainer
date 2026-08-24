/**
 * PLACEHOLDERS. Five values to fill in before this page is shared.
 */
const DETAILS = {
  name: "Ahmed Khan",
  programme: "MS Artificial Intelligence",
  institution: "",
  semester:
    "National University of Computer and Emerging Sciences (NUCES-FAST)",
  proposalPdf: "/proposal.pdf",
  email: "i257633@isb.nu.edu.pk",
};

export function Footer() {
  return (
    <footer className="footer measure">
      <p className="footer__name">{DETAILS.name}</p>
      <p className="footer__line">
        {DETAILS.programme} {DETAILS.institution}
      </p>
      {DETAILS.semester && <p className="footer__line">{DETAILS.semester}</p>}

      <ul className="footer__links">
        <li>
          <a href={DETAILS.proposalPdf}>
            <DownloadIcon />
            Full written proposal (PDF)
          </a>
        </li>
        <li>
          <a href={`mailto:${DETAILS.email}`}>{DETAILS.email}</a>
        </li>
      </ul>

      <p className="footer__note">
        Every figure on this page runs on illustrative synthetic data. Nothing
        shown here is an experimental result.
      </p>
    </footer>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.75v11m0 0 4-4m-4 4-4-4M4.25 18.5v1.75h15.5V18.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
