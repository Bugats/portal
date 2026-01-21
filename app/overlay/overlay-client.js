"use client";

import { useEffect, useMemo, useState } from "react";

function getSearchParam(searchParams, key) {
  const value = searchParams?.[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? null;
}

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

export default function OverlayClient({ searchParams }) {
  const revealMs = useMemo(() => {
    const raw = Number(getSearchParam(searchParams, "delay") ?? 5000);
    if (!Number.isFinite(raw)) {
      return 5000;
    }
    return Math.min(Math.max(raw, 1000), 20000);
  }, [searchParams]);
  const pollMs = useMemo(() => {
    const raw = Number(getSearchParam(searchParams, "poll") ?? 3000);
    if (!Number.isFinite(raw)) {
      return 3000;
    }
    return Math.min(Math.max(raw, 1000), 15000);
  }, [searchParams]);
  const transparent = getSearchParam(searchParams, "transparent") === "1";

  const [reading, setReading] = useState(null);
  const [revealCount, setRevealCount] = useState(0);
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
    if (!reading?.cards?.length) {
      setRevealCount(0);
      return;
    }

    const total = reading.cards.length;
    setRevealCount(1);

    const timers = [];
    for (let index = 2; index <= total; index += 1) {
      timers.push(
        setTimeout(() => {
          setRevealCount(index);
        }, revealMs * (index - 1))
      );
    }

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [reading?.id, reading?.cards?.length, revealMs]);

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
          {revealCount === 0 ? (
            <div className="empty-state">Shuffling cards...</div>
          ) : null}
          <section className="card-grid">
            {reading.cards.map((card, index) => {
              const isRevealed = index < revealCount;

              return (
                <article
                  className={`card ${isRevealed ? "" : "card-placeholder"}`}
                  key={`${card.name_short}-${index}`}
                >
                  <div className="card-header">
                    <span className="badge">
                      {card.position ?? `Card ${index + 1}`}
                    </span>
                    {isRevealed ? (
                      <span className="card-type">
                        {formatArcana(card)} · {formatOrientation(card)}
                      </span>
                    ) : null}
                  </div>
                  {isRevealed ? (
                    <>
                      <img
                        className="card-image"
                        src={card.imageUrl}
                        alt={card.name}
                      />
                      <h2 className="card-title">{card.name}</h2>
                      <p className="card-text card-ai">
                        <span className="ai-label">AI insight:</span>{" "}
                        {card.interpretation}
                      </p>
                    </>
                  ) : (
                    <div className="card-back">Card is being revealed...</div>
                  )}
                </article>
              );
            })}
          </section>

          {reading.summary && revealCount >= reading.cards.length ? (
            <section className="summary">
              <h2 className="summary-title">Final summary</h2>
              <ul className="summary-list">
                {reading.summary.lines?.map((line, index) => (
                  <li key={`summary-${index}`}>{line}</li>
                ))}
              </ul>
              <p className="summary-final">{reading.summary.finalText}</p>
            </section>
          ) : null}

          {reading.question && revealCount >= reading.cards.length ? (
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
