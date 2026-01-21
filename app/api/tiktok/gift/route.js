import { NextResponse } from "next/server";
import {
  buildReading,
  drawFromDeck,
  fetchTarotCards,
} from "../../../../lib/tarot";
import {
  getDeckState,
  setDeckState,
  setLatestReading,
} from "../../../../lib/tarotStore";

export const dynamic = "force-dynamic";

const TRIGGER_GIFTS = (process.env.TAROT_GIFT_TRIGGER || "train")
  .split(",")
  .map((gift) => gift.trim().toLowerCase())
  .filter(Boolean);

const TRIGGER_GIFTS_COMPACT = TRIGGER_GIFTS.map((gift) =>
  gift.replace(/[^a-z0-9]/g, "")
);

function normalizeGiftName(name) {
  return name ? name.toString().trim().toLowerCase() : "";
}

function isTriggerGift(name) {
  if (!name) {
    return false;
  }

  if (TRIGGER_GIFTS.includes("any") || TRIGGER_GIFTS.includes("*")) {
    return true;
  }

  const normalized = normalizeGiftName(name);
  const compact = normalized.replace(/[^a-z0-9]/g, "");

  return (
    TRIGGER_GIFTS.includes(normalized) ||
    TRIGGER_GIFTS_COMPACT.includes(compact)
  );
}

function buildViewer(payload) {
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
  const name =
    payload?.giftName ||
    payload?.gift ||
    payload?.gift_name ||
    payload?.giftType ||
    null;

  if (!name) {
    return null;
  }

  return {
    name,
    id: payload?.giftId ?? payload?.gift_id ?? null,
    value:
      payload?.giftValue ??
      payload?.gift_value ??
      payload?.diamondCount ??
      null,
    repeatCount: payload?.repeatCount ?? payload?.repeat_count ?? null,
  };
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

  const gift = buildGift(payload);

  if (!gift?.name) {
    return NextResponse.json(
      { error: "Missing giftName." },
      { status: 400 }
    );
  }

  if (!isTriggerGift(gift.name)) {
    return NextResponse.json({ status: "ignored" });
  }

  const count = Number(
    payload?.count ?? payload?.cardCount ?? process.env.TAROT_CARD_COUNT ?? 3
  );
  const viewer = buildViewer(payload);
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

  return NextResponse.json({ status: "ok", reading });
}
