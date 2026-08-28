import { ImageResponse } from "next/og";
import { activeBrand, isLeilaProduct } from "@/lib/product";

export const alt = `${activeBrand.productName}, an unofficial daily quote app built by Tehron Porter`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const background = isLeilaProduct ? activeBrand.colors.shareBackground : "#0B0B0B";
  const foreground = isLeilaProduct ? activeBrand.colors.shareForeground : "white";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background,
        color: foreground,
        padding: "64px 72px",
        fontFamily: "Arial Narrow, sans-serif"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
        <span>{isLeilaProduct ? activeBrand.productName.toUpperCase() : "TEHRON PORTER"}</span>
        <span style={{ opacity: 0.6 }}>{isLeilaProduct ? "UNOFFICIAL · SOURCE VERIFIED" : "DESIGNER + CREATIVE TECHNOLOGIST"}</span>
      </div>
      <div style={{ display: "flex", maxWidth: 1010, fontSize: 108, lineHeight: 0.86, fontWeight: 900, textTransform: "uppercase" }}>
        {isLeilaProduct ? "LEADERSHIP IDEAS WORTH REMEMBERING." : "I didn’t just apply. I built something too."}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
        <span>{isLeilaProduct ? "LEILA SAID · AN INDEPENDENT CONCEPT" : "ALEX SAID · A CASE STUDY FOR ACQUISITION.COM"}</span>
        <span style={{ opacity: 0.6 }}>LAS VEGAS, NV</span>
      </div>
    </div>,
    size
  );
}
