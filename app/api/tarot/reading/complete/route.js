import { NextResponse } from "next/server";
import { completeReading } from "../../../../../lib/tarotStore";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let payload = {};

  try {
    payload = await request.json();
  } catch (error) {
    payload = {};
  }

  const readingId = payload?.id || payload?.readingId || null;

  if (!readingId) {
    return NextResponse.json(
      { error: "Missing reading id." },
      { status: 400 }
    );
  }

  const result = await completeReading(readingId);

  return NextResponse.json(
    { reading: result.active, queueLength: result.queueLength },
    { headers: { "Cache-Control": "no-store" } }
  );
}
