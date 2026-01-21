import { NextResponse } from "next/server";

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

function drawCards(cards, count) {
  const pool = cards.slice();

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, count);
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(
    Math.max(Number(searchParams.get("count") ?? 3), 1),
    5
  );

  let response;

  try {
    response = await fetch(TAROT_API_URL, { next: { revalidate: 86400 } });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reach tarot data provider." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Tarot data provider returned an error." },
      { status: 502 }
    );
  }

  const payload = await response.json();
  const cards = Array.isArray(payload.cards) ? payload.cards : [];

  const enriched = cards
    .map((card) => ({
      ...card,
      imageUrl: buildImageUrl(card),
      imageIndex: getImageIndex(card),
    }))
    .filter((card) => Boolean(card.imageUrl));

  if (enriched.length === 0) {
    return NextResponse.json(
      { error: "No cards available from the provider." },
      { status: 502 }
    );
  }

  return NextResponse.json({ cards: drawCards(enriched, count) });
}
