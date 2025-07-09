"use client";
import { CanvasWrapper } from "@/src/call/CanvasWrapper";
import Script from "next/script";

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return (
    <>
      <CanvasWrapper />
      <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />
    </>
  );
}
