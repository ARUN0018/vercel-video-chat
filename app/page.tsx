"use client";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { CanvasWrapper } from "../src/call/CanvasWrapper";
import { Suspense } from "react";

function PageContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const query =
    typeParam === "caller" || typeParam === "receiver" ? typeParam : "caller";

  return (
    <>
      <CanvasWrapper type={query} />
      <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageContent />
    </Suspense>
  );
}
