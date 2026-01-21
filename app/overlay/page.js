import { Suspense } from "react";
import OverlayClient from "./overlay-client";

export const dynamic = "force-dynamic";

function OverlayFallback() {
  return (
    <main className="container overlay">
      <div className="empty-state">Loading overlay...</div>
    </main>
  );
}

export default function OverlayPage({ searchParams }) {
  return (
    <Suspense fallback={<OverlayFallback />}>
      <OverlayClient searchParams={searchParams} />
    </Suspense>
  );
}
