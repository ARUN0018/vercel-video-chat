"use client";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { CanvasWrapper } from "../src/call/CanvasWrapper";

export default function Page() {
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
