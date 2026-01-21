import { NextResponse } from "next/server";
import { drawCards, fetchTarotCards } from "../../../lib/tarot";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(
    Math.max(Number(searchParams.get("count") ?? 3), 1),
    5
  );

  try {
    const cards = await fetchTarotCards();
    return NextResponse.json({ cards: drawCards(cards, count) });
  } catch (error) {
    return NextResponse.json(
      { error: "Unable to load tarot cards right now." },
      { status: 502 }
    );
  }
}
