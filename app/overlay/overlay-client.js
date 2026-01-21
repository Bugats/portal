"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function getSearchParam(searchParams, key) {
  const value = searchParams?.[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? null;
}

function formatArcana(card) {
  return card.type === "major" ? "Lielie Arkāni" : "Mazie Arkāni";
}

function formatOrientation(card) {
  return card.orientation === "reversed" ? "Apgriezta" : "Taisni";
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

function hashString(input) {
  if (!input) {
    return 0;
  }

  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

function pickCelebrationMessage(reading) {
  const viewer = reading?.viewer?.name;
  const gift = reading?.gift?.name;
  const viewerText = viewer ? `, ${viewer}` : "";
  const giftText = gift ? ` par dāvanu "${gift}"` : " par dāvanu";

  const variants = [
    `Paldies${viewerText}! Tava dāvana iedarbina tarot.`,
    `Super${viewerText}! Paldies${giftText}.`,
    `Paldies${viewerText}! Sajaucam kārtis un sākam izlikumu.`,
    `Liels paldies${viewerText}${giftText}!`,
  ];

  const index = hashString(reading?.id) % variants.length;
  return variants[index];
}

export default function OverlayClient({ searchParams }) {
  const activeReadingIdRef = useRef(null);
  const minimal =
    getSearchParam(searchParams, "minimal") === "1" ||
    getSearchParam(searchParams, "clean") === "1";
  const showMeta = !minimal;
  const celebrateMs = useMemo(() => {
    const raw = Number(getSearchParam(searchParams, "celebrate") ?? 7000);
    if (!Number.isFinite(raw)) {
      return 7000;
    }
    return Math.min(Math.max(raw, 1000), 20000);
  }, [searchParams]);
  const stepMs = useMemo(() => {
    const raw = Number(
      getSearchParam(searchParams, "step") ??
        getSearchParam(searchParams, "card") ??
        getSearchParam(searchParams, "delay") ??
        20000
    );
    if (!Number.isFinite(raw)) {
      return 20000;
    }
    return Math.min(Math.max(raw, 5000), 60000);
  }, [searchParams]);
  const hideMs = useMemo(() => {
    const raw = Number(getSearchParam(searchParams, "hide") ?? 20000);
    if (!Number.isFinite(raw)) {
      return 20000;
    }
    return Math.min(Math.max(raw, 5000), 60000);
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
  const [startTime, setStartTime] = useState(null);
  const [, setTick] = useState(0);
  const [error, setError] = useState("");
  const completedReadingRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadReading = async () => {
      try {
        const response = await fetch("/api/tarot/reading", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Neizdevās ielādēt pareģojumu.");
        }

        const data = await response.json();
        if (isMounted) {
          setReading(data.reading ?? null);
          if (
            data.reading?.id &&
            data.reading.id !== activeReadingIdRef.current
          ) {
            activeReadingIdRef.current = data.reading.id;
            completedReadingRef.current = null;
            setStartTime(Date.now());
          }
          setError("");
        }
      } catch (err) {
        if (isMounted) {
          setError("Nevar ielādēt pareģojumu.");
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
    const interval = setInterval(() => {
      setTick((value) => value + 1);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!reading?.id || !startTime) {
      return;
    }

    const totalCards = reading.cards?.length ?? 0;
    if (!totalCards) {
      return;
    }

    const summaryStart = celebrateMs + stepMs * totalCards;
    const summaryEnd = summaryStart + hideMs;
    const elapsed = Date.now() - startTime;

    if (elapsed >= summaryEnd && completedReadingRef.current !== reading.id) {
      completedReadingRef.current = reading.id;
      fetch("/api/tarot/reading/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reading.id }),
      }).catch(() => {});
    }
  }, [reading?.id, reading?.cards?.length, startTime, celebrateMs, stepMs, hideMs, tick]);

  useEffect(() => {
    if (transparent) {
      document.body.style.background = "transparent";
    }

    return () => {
      document.body.style.background = "";
    };
  }, [transparent]);

  return (
    <main className={`container overlay ${minimal ? "overlay-minimal" : ""}`}>
      {!minimal ? (
        <header className="header">
          <div className="eyebrow">Dāvanu pareģojums tiešraidē</div>
          <h1 className="title">Trīs kāršu tarot</h1>
          <p className="subtitle">
            Overlay atjaunojas, kad nostrādā dāvanas trigeris. Pievieno šo lapu
            Live Studio kā pārlūka avotu.
          </p>
          <div className="meta">
            {reading?.viewer?.name ? (
              <span className="badge">Skatītājs: {reading.viewer.name}</span>
            ) : null}
            {reading?.gift?.name ? (
              <span className="badge">Dāvana: {reading.gift.name}</span>
            ) : null}
            {reading?.createdAt ? (
              <span className="card-type">{formatTime(reading.createdAt)}</span>
            ) : null}
          </div>
        </header>
      ) : null}

      {error && !minimal ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : null}

      {!reading ? (
        minimal ? null : <div className="empty-state">Gaida dāvanas trigeri...</div>
      ) : (
        <>
          {(() => {
            const cards = Array.isArray(reading.cards) ? reading.cards : [];
            const totalCards = cards.length;
            const elapsed = startTime ? Date.now() - startTime : 0;
            const celebration = elapsed < celebrateMs;
            const cardsStart = celebrateMs;
            const cardsElapsed = Math.max(elapsed - cardsStart, 0);
            const currentIndex = Math.min(
              Math.floor(cardsElapsed / stepMs),
              Math.max(totalCards - 1, 0)
            );
            const summaryStart = cardsStart + stepMs * totalCards;
            const summaryEnd = summaryStart + hideMs;
            const showingAll = totalCards > 0 && elapsed >= summaryStart;
            const expired = totalCards > 0 && elapsed >= summaryEnd;
            const cardsToShow = showingAll
              ? cards
              : cards.length
              ? [cards[currentIndex]]
              : [];
            const theme = reading.question || "Kāda būs šī nedēļa?";
            const secondsLeft = Math.max(
              0,
              Math.ceil((celebrateMs - elapsed) / 1000)
            );

            if (celebration) {
              const message = pickCelebrationMessage(reading);
              return (
                <div className="celebration">
                  <div className="celebration-title">{message}</div>
                  <div className="celebration-subtitle">
                    Taro sākas pēc {secondsLeft} sekundēm
                  </div>
                </div>
              );
            }

            if (expired) {
              return minimal ? null : (
                <div className="empty-state">Gaida nākamo dāvanu...</div>
              );
            }

            return (
              <>
                <section className="card-grid">
                  {cardsToShow.filter(Boolean).map((card, index) => (
                    <article className="card" key={`${card.name_short}-${index}`}>
                      <div className="card-header">
                        <span className="badge">
                          {card.position ?? `Kārts ${currentIndex + 1}`}
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
                      <p className="card-text card-ai">
                        <span className="ai-label">AI skaidrojums:</span>{" "}
                        {card.interpretation}
                      </p>
                      {!showingAll && showMeta ? (
                        <div className="phase-note">
                          Kārts {currentIndex + 1} no {totalCards}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </section>

                {showingAll && reading.summary ? (
                  <section className="summary">
                    <h2 className="summary-title">Kopējā aina</h2>
                    <div className="summary-theme">Tēma: {theme}</div>
                    <ul className="summary-list">
                      {reading.summary.lines?.map((line, index) => (
                        <li key={`summary-${index}`}>{line}</li>
                      ))}
                    </ul>
                    <p className="summary-final">{reading.summary.finalText}</p>
                  </section>
                ) : null}
              </>
            );
          })()}
        </>
      )}
    </main>
  );
}
