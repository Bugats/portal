import { randomInt } from "crypto";

const TAROT_API_URL = "https://tarotapi.dev/api/v1/cards";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/renanbotasse/tarot/main/deck";

const SUIT_OFFSETS = {
  wa: 22,
  pe: 36,
  cu: 50,
  sw: 64,
};

const RANK_INDEX = {
  ace: 0,
  two: 1,
  three: 2,
  four: 3,
  five: 4,
  six: 5,
  seven: 6,
  eight: 7,
  nine: 8,
  ten: 9,
  page: 10,
  knight: 11,
  queen: 12,
  king: 13,
};

const NAME_ALIASES = {
  Fortitude: "Strength",
};

const POSITIONS = ["Past", "Present", "Future", "Advice", "Outcome"];

function secureRandomInt(max) {
  if (!Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return randomInt(max);
}

function shuffleList(list) {
  const pool = list.slice();

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = secureRandomInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}

function buildInterpretation(card, position) {
  const meaning = shortMeaning(
    card.meaning || card.meaning_up || card.desc || ""
  );
  const safeMeaning = meaning || "a shift in perspective";
  const orientationLabel =
    card.orientation === "reversed" ? "reversed" : "upright";
  const positionText = position ? position.toLowerCase() : "this moment";
  const templates = [
    `In the ${positionText} position, ${card.name} (${orientationLabel}) points to ${safeMeaning}.`,
    `${card.name} (${orientationLabel}) in ${positionText} suggests ${safeMeaning}.`,
    `For ${positionText}, ${card.name} (${orientationLabel}) highlights ${safeMeaning}.`,
  ];

  return templates[secureRandomInt(templates.length)];
}

function normalizeName(name) {
  if (!name) {
    return "";
  }

  let normalized = NAME_ALIASES[name] ?? name;

  if (normalized.startsWith("The ")) {
    normalized = normalized.slice(4);
  }

  normalized = normalized.replace(/\bof\b/gi, "of");
  return normalized.replace(/\s+/g, "_");
}

function getImageIndex(card) {
  if (card.type === "major") {
    const majorIndex = Number(card.value_int);
    return Number.isFinite(majorIndex) ? majorIndex : null;
  }

  const suitCode = card.name_short?.slice(0, 2);
  const offset = SUIT_OFFSETS[suitCode];
  const rankIndex = RANK_INDEX[card.value];

  if (offset === undefined || rankIndex === undefined) {
    return null;
  }

  return offset + rankIndex;
}

function buildImageUrl(card) {
  const imageIndex = getImageIndex(card);
  if (imageIndex === null) {
    return null;
  }

  const paddedIndex = String(imageIndex).padStart(2, "0");
  const nameSegment = normalizeName(card.name);

  return `${IMAGE_BASE_URL}/${paddedIndex}_${nameSegment}.jpg`;
}

function shortMeaning(text) {
  if (!text) {
    return "";
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  const matchIndex = normalized.search(/[.;]/);

  if (matchIndex === -1) {
    return normalized;
  }

  return normalized.slice(0, matchIndex).trim();
}

export function enrichCards(cards) {
  if (!Array.isArray(cards)) {
    return [];
  }

  return cards
    .map((card) => ({
      ...card,
      imageUrl: buildImageUrl(card),
      imageIndex: getImageIndex(card),
    }))
    .filter((card) => Boolean(card.imageUrl));
}

export async function fetchTarotCards() {
  const response = await fetch(TAROT_API_URL, {
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error("Tarot data provider returned an error.");
  }

  const payload = await response.json();
  const enriched = enrichCards(payload.cards);

  if (enriched.length === 0) {
    throw new Error("No cards available from the provider.");
  }

  return enriched;
}

export function drawCards(cards, count) {
  return shuffleList(cards).slice(0, count);
}

export function assignOrientations(cards) {
  return cards.map((card) => {
    const orientation = secureRandomInt(2) === 0 ? "upright" : "reversed";
    return {
      ...card,
      orientation,
      meaning:
        orientation === "upright" ? card.meaning_up : card.meaning_rev,
    };
  });
}

export function drawFromDeck(cards, count, deckState = {}) {
  const cardMap = new Map(cards.map((card) => [card.name_short, card]));
  const normalizedCount = Math.min(Math.max(Number(count ?? 3), 1), cards.length);
  const initialOrder = Array.isArray(deckState.order) ? deckState.order : [];
  let cursor = Number.isFinite(deckState.cursor) ? deckState.cursor : 0;
  let order = initialOrder.filter((name) => cardMap.has(name));

  if (order.length !== cards.length || cursor >= order.length) {
    order = shuffleList(cards.map((card) => card.name_short));
    cursor = 0;
  }

  if (cursor + normalizedCount > order.length) {
    order = shuffleList(cards.map((card) => card.name_short));
    cursor = 0;
  }

  let slice = order.slice(cursor, cursor + normalizedCount);
  let drawn = slice.map((name) => cardMap.get(name)).filter(Boolean);

  if (drawn.length !== normalizedCount) {
    order = shuffleList(cards.map((card) => card.name_short));
    cursor = 0;
    slice = order.slice(cursor, cursor + normalizedCount);
    drawn = slice.map((name) => cardMap.get(name)).filter(Boolean);
  }

  cursor += normalizedCount;

  return { drawn, deckState: { order, cursor } };
}

export function buildSummary(cards) {
  const lines = cards.map((card, index) => {
    const position = card.position || POSITIONS[index] || `Card ${index + 1}`;
    const meaning = shortMeaning(
      card.meaningShort || card.meaning || card.meaning_up
    );
    return `${position}: ${card.name} - ${meaning}.`;
  });

  const lastCard = cards[cards.length - 1];
  const closingMeaning = shortMeaning(
    lastCard?.meaning || lastCard?.meaning_up
  );

  const finalText = lastCard
    ? `Final message: ${lastCard.name} points to ${closingMeaning}.`
    : "Final message: Trust your next step.";

  return { lines, finalText };
}

export function buildReading(cards, options = {}) {
  const count = Math.min(Math.max(Number(options.count ?? 3), 1), 5);
  const drawn =
    Array.isArray(options.drawnCards) && options.drawnCards.length > 0
      ? options.drawnCards.slice(0, count)
      : drawCards(cards, count);
  const oriented = assignOrientations(drawn);
  const positions = POSITIONS.slice(0, count);
  const withContext = oriented.map((card, index) => {
    const position = positions[index] || `Card ${index + 1}`;
    const meaningShort = shortMeaning(card.meaning || card.meaning_up);

    return {
      ...card,
      position,
      meaningShort,
      interpretation: buildInterpretation(card, position),
    };
  });
  const summary = buildSummary(withContext);
  const id =
    globalThis.crypto?.randomUUID?.() ?? `reading_${Date.now().toString(36)}`;

  return {
    id,
    createdAt: new Date().toISOString(),
    count,
    positions,
    cards: withContext,
    summary,
    viewer: options.viewer ?? null,
    gift: options.gift ?? null,
    question: options.question ?? null,
  };
}
