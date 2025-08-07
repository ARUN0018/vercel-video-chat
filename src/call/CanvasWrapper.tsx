"use client";
import dynamic from "next/dynamic";

const DynamicCanvas = dynamic<{ type: "caller" | "receiver" }>(
  () => import("./Canvas"),
  { ssr: false }
);

export const CanvasWrapper = ({ type }: { type: "caller" | "receiver" }) => {
  return <DynamicCanvas type={type} />;
};
