"use client";

import { useCallback, useEffect, useState } from "react";

const POSITIONS = ["Pagātne", "Tagadne", "Nākotne"];

function formatArcana(card) {
  return card.type === "major" ? "Lielie Arkāni" : "Mazie Arkāni";
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
      setError("Nevar ielādēt tarot kārtis.");
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
        <div className="eyebrow">Tarot overlay demonstrācija</div>
        <h1 className="title">Trīs kāršu tarot izlikums</h1>
        <p className="subtitle">
          Izmanto ārēju tarot datu API un bilžu hostingu, lai parādītu trīs
          kāršu izlikumu tiešraides laikā.
        </p>
        <div className="controls">
          <button className="button" onClick={drawCards} disabled={loading}>
            {loading ? "Izlozē..." : "Izvilkt 3 kārtis"}
          </button>
          <span className="hint">Tikai izklaidei.</span>
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
          Overlay: <a href="/overlay">/overlay</a> (lasa{" "}
          <code>/api/tarot/reading</code>, parametri{" "}
          <code>?celebrate=7000</code> un <code>?step=20000</code>. Tīram
          overlay lieto <code>&amp;minimal=1</code>.)
        </div>
        <div>
          Webhook: <code>POST /api/tiktok/gift</code> ar{" "}
          <code>{`{ giftName, userName }`}</code>. Dāvanu trigeri iestati ar{" "}
          <code>TAROT_GIFT_TRIGGER</code> (default: train), vai izmanto{" "}
          <code>TAROT_GIFT_IDS</code> / <code>TAROT_GIFT_MIN_VALUE</code>{" "}
          valodas drošai atbilstībai.
        </div>
        <div>
          Datu avots: tarotapi.dev. Attēli hostēti GitHub
          (renanbotasse/tarot, MIT license).
        </div>
      </footer>
    </main>
  );
}
