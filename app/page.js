"use client";

import { useCallback, useEffect, useState } from "react";

const POSITIONS = ["Past", "Present", "Future"];

function formatArcana(card) {
  return card.type === "major" ? "Major Arcana" : "Minor Arcana";
}

export default function HomePage() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const drawCards = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tarot?count=3", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load cards.");
      }

      const data = await response.json();
      setCards(Array.isArray(data.cards) ? data.cards : []);
    } catch (err) {
      setError("Unable to load the tarot cards right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    drawCards();
  }, [drawCards]);

  return (
    <main className="container">
      <header className="header">
        <div className="eyebrow">Tarot overlay demo</div>
        <h1 className="title">Three-card tarot draw</h1>
        <p className="subtitle">
          Uses an external tarot data API and external image hosting so you can
          show a quick three-card spread during a stream trigger.
        </p>
        <div className="controls">
          <button className="button" onClick={drawCards} disabled={loading}>
            {loading ? "Drawing..." : "Draw 3 cards"}
          </button>
          <span className="hint">For entertainment only.</span>
        </div>
      </header>

      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}

      <section className="card-grid">
        {cards.map((card, index) => (
          <article className="card" key={`${card.name_short}-${index}`}>
            <div className="card-header">
              <span className="badge">
                {POSITIONS[index] ?? `Card ${index + 1}`}
              </span>
              <span className="card-type">{formatArcana(card)}</span>
            </div>
            <img
              className="card-image"
              src={card.imageUrl}
              alt={card.name}
              loading="lazy"
            />
            <h2 className="card-title">{card.name}</h2>
            <p className="card-text">{card.meaning_up}</p>
            <p className="card-text">Reversed: {card.meaning_rev}</p>
          </article>
        ))}
      </section>

      <footer className="footer">
        <div>
          Overlay: <a href="/overlay">/overlay</a> (polls{" "}
          <code>/api/tarot/reading</code>, reveal delay via{" "}
          <code>?delay=5000</code>).
        </div>
        <div>
          Webhook: <code>POST /api/tiktok/gift</code> with{" "}
          <code>{`{ giftName, userName }`}</code>. Configure trigger gifts with{" "}
          <code>TAROT_GIFT_TRIGGER</code> (default: train).
        </div>
        <div>
          Data source: tarotapi.dev. Images hosted on GitHub
          (renanbotasse/tarot, MIT license).
        </div>
      </footer>
    </main>
  );
}
