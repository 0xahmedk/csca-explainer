import { useMemo } from "react";
import { SECTIONS } from "./content.js";
import { AuthorBadge } from "./components/AuthorBadge.jsx";
import { Footer } from "./components/Footer.jsx";
import { ProgressNav } from "./components/ProgressNav.jsx";
import { Section } from "./components/Section.jsx";
import { useTheme } from "./hooks/useTheme.js";
import { useReadingProgress } from "./hooks/useReadingProgress.js";

export default function App() {
  const ids = useMemo(() => SECTIONS.map((section) => section.id), []);
  const { activeId, progress } = useReadingProgress(ids);
  const { toggle } = useTheme();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <ProgressNav
        sections={SECTIONS}
        activeId={activeId}
        progress={progress}
        onToggleTheme={toggle}
      />

      <div className="page">
        <header className="masthead measure">
          <p className="masthead__eyebrow">Research proposal</p>
          <h1 className="masthead__title">
            Cutting false alarms in real-time cache side-channel detection
          </h1>
          <p className="masthead__standfirst">
            Published detectors reach roughly 96 percent accuracy, yet their
            authors name false alarms as the open problem. Under load an honest
            workload looks like an attacker. This work asks whether a temporal
            graph model can tell them apart.
          </p>
          <div className="masthead__meta">
            <AuthorBadge />
            <span>Draft, August 2026</span>
            <span>Approx. 8 minutes</span>
          </div>
        </header>

        <main id="main">
          {SECTIONS.map((section, index) => (
            <Section key={section.id} section={section} index={index} />
          ))}
        </main>

        <Footer />
      </div>
    </>
  );
}
