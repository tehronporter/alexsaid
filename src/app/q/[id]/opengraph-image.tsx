import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { quoteRepository } from "@/lib/catalog";

export const alt = "Hormozi Said quote card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = quoteRepository.getById(id);
  if (!quote) notFound();
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#6B2CFF", color: "white", padding: "64px 72px", fontFamily: "Arial Narrow, sans-serif" }}>
      <div style={{ display: "flex", fontSize: 86, lineHeight: 1 }}>“</div>
      <div style={{ display: "flex", maxWidth: 1020, fontSize: quote.text.length > 80 ? 58 : 76, lineHeight: 0.94, fontWeight: 900, textTransform: "uppercase" }}>{quote.text}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 700 }}><span>{quote.author.toUpperCase()}</span><span>HORMOZI SAID · UNOFFICIAL</span></div>
    </div>,
    size
  );
}
