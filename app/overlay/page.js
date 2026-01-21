"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const POSITIONS = ["Past", "Present", "Future", "Advice", "Outcome"];

function formatArcana(card) {
  return card.type === "major" ? "Major Arcana" : "Minor Arcana";
}

function formatOrientation(card) {
  return card.orientation === "reversed" ? "Reversed" : "Upright";
}

function formatTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function OverlayPage() {
  const searchParams = useSearchParams();
  const pollMs = useMemo(() => {
    const raw = Number(searchParams.get("poll") ?? 3000);
    if (!Number.isFinite(raw)) {
      return 3000;
    }
    return Math.min(Math.max(raw, 1000), 15000);
  }, [searchParams]);
  const transparent = searchParams.get("transparent") === "1";

  const [reading, setReading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadReading = async () => {
      try {
        const response = await fetch("/api/tarot/reading", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load reading.");
        }

        const data = await response.json();
        if (isMounted) {
          setReading(data.reading ?? null);
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError("Unable to load reading.");
        }
      }
    };

    loadReading();
    const interval = setInterval(loadReading, pollMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pollMs]);

  useEffect(() => {
    if (transparent) {
      document.body.style.background = "transparent";
    }

    return () => {
      document.body.style.background = "";
    };
  }, [transparent]);

  return (
    <main className="container overlay">
      <header className="header">
        <div className="eyebrow">Live gift reading</div>
        <h1 className="title">Three-card tarot</h1>
        <p className="subtitle">
          This overlay updates when the gift trigger fires. Add this page to OBS
          as a browser source.
        </p>
        <div className="meta">
          {reading?.viewer?.name ? (
            <span className="badge">Viewer: {reading.viewer.name}</span>
          ) : null}
          {reading?.gift?.name ? (
            <span className="badge">Gift: {reading.gift.name}</span>
          ) : null}
          {reading?.createdAt ? (
            <span className="card-type">{formatTime(reading.createdAt)}</span>
          ) : null}
        </div>
      </header>

      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}

      {!reading ? (
        <div className="empty-state">Waiting for a gift trigger...</div>
      ) : (
        <>
          <section className="card-grid">
            {reading.cards.map((card, index) => (
              <article className="card" key={`${card.name_short}-${index}`}>
                <div className="card-header">
                  <span className="badge">
                    {POSITIONS[index] ?? `Card ${index + 1}`}
                  </span>
                  <span className="card-type">
                    {formatArcana(card)} · {formatOrientation(card)}
                  </span>
                </div>
                <img
                  className="card-image"
                  src={card.imageUrl}
                  alt={card.name}
                />
                <h2 className="card-title">{card.name}</h2>
                <p className="card-text">{card.meaning}</p>
              </article>
            ))}
          </section>

          {reading.summary ? (
            <section className="summary">
              <h2 className="summary-title">Reading summary</h2>
              <ul className="summary-list">
                {reading.summary.lines?.map((line, index) => (
                  <li key={`summary-${index}`}>{line}</li>
                ))}
              </ul>
              <p className="summary-final">{reading.summary.finalText}</p>
            </section>
          ) : null}

          {reading.question ? (
            <section className="summary">
              <h2 className="summary-title">Viewer question</h2>
              <p className="summary-final">{reading.question}</p>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
