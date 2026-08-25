import { ImageResponse } from "next/og";

export const alt = "Alex Said, a daily quote app built by Tehron Porter for Acquisition.com";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0B0B0B",
        color: "white",
        padding: "64px 72px",
        fontFamily: "Arial Narrow, sans-serif"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
        <span>TEHRON PORTER</span>
        <span style={{ opacity: 0.6 }}>DESIGNER + CREATIVE TECHNOLOGIST</span>
      </div>
      <div style={{ display: "flex", maxWidth: 1010, fontSize: 108, lineHeight: 0.86, fontWeight: 900, textTransform: "uppercase" }}>
        I didn’t just apply. I built something too.
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>
        <span>ALEX SAID · A CASE STUDY FOR ACQUISITION.COM</span>
        <span style={{ opacity: 0.6 }}>LAS VEGAS, NV</span>
      </div>
    </div>,
    size
  );
}
