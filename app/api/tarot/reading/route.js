import { NextResponse } from "next/server";
import {
  buildReading,
  drawFromDeck,
  fetchTarotCards,
} from "../../../../lib/tarot";
import {
  getDeckState,
  getLatestReading,
  setDeckState,
  setLatestReading,
} from "../../../../lib/tarotStore";

export const dynamic = "force-dynamic";

function buildViewer(payload) {
  if (payload?.viewer && (payload.viewer.name || payload.viewer.id)) {
    return {
      name: payload.viewer.name ?? "Viewer",
      id: payload.viewer.id ?? null,
    };
  }

  const name =
    payload?.viewerName ||
    payload?.userName ||
    payload?.nickname ||
    payload?.uniqueId ||
    null;
  const id = payload?.viewerId || payload?.userId || payload?.uniqueId || null;

  if (!name && !id) {
    return null;
  }

  return { name: name ?? "Viewer", id };
}

function buildGift(payload) {
  const name = payload?.giftName || payload?.gift?.name || payload?.gift || null;

  if (!name) {
    return null;
  }

  return {
    name,
    id: payload?.giftId ?? payload?.gift?.id ?? null,
    value: payload?.giftValue ?? payload?.gift?.value ?? null,
  };
}

export async function GET() {
  const reading = getLatestReading();
  return NextResponse.json(
    { reading },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 }
    );
  }

  const count = Number(payload?.count ?? process.env.TAROT_CARD_COUNT ?? 3);
  const viewer = buildViewer(payload);
  const gift = buildGift(payload);
  const question =
    payload?.question || payload?.comment || payload?.message || null;

  let cards;

  try {
    cards = await fetchTarotCards();
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load tarot cards right now." },
      { status: 502 }
    );
  }

  const { drawn, deckState } = drawFromDeck(cards, count, getDeckState());
  setDeckState(deckState);

  const reading = buildReading(cards, {
    count,
    viewer,
    gift,
    question,
    drawnCards: drawn,
  });

  setLatestReading(reading);

  return NextResponse.json(
    { reading },
    { headers: { "Cache-Control": "no-store" } }
  );
}
