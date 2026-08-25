"use client";

import type { Quote } from "@/domain/catalog";

export type ShareCardFormat = "square" | "story";

export function wrapShareCardLines(context: Pick<CanvasRenderingContext2D, "measureText">, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !line) line = candidate;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderShareCardBlob(quote: Quote, format: ShareCardFormat) {
  await document.fonts.ready;
  const width = 1080;
  const height = format === "square" ? 1080 : 1920;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available");

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#9D6CFF");
  gradient.addColorStop(0.45, "#6B2CFF");
  gradient.addColorStop(1, "#35108F");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.13;
  for (let index = 0; index < 220; index += 1) {
    const x = (index * 97) % width;
    const y = (index * 193) % height;
    context.fillStyle = index % 2 === 0 ? "#FFFFFF" : "#0B0B0B";
    context.fillRect(x, y, 2, 2);
  }
  context.globalAlpha = 1;

  const horizontalPadding = 96;
  context.fillStyle = "#FFFFFF";
  context.font = "700 100px 'Bebas Neue', 'Arial Narrow', sans-serif";
  context.fillText("“", horizontalPadding, format === "square" ? 150 : 240);

  const fontSize = quote.text.length > 100 ? 76 : quote.text.length > 60 ? 88 : 108;
  const lineHeight = fontSize * 0.96;
  context.font = `400 ${fontSize}px 'Bebas Neue', 'Arial Narrow', sans-serif`;
  const lines = wrapShareCardLines(context, (quote.shareCardVersion ?? quote.text).toUpperCase(), width - horizontalPadding * 2);
  const contentHeight = lines.length * lineHeight;
  const startY = Math.max(format === "square" ? 270 : 520, (height - contentHeight) / 2);
  lines.forEach((line, index) => context.fillText(line, horizontalPadding, startY + index * lineHeight));

  context.font = "700 30px Inter, sans-serif";
  context.fillText(quote.author.toUpperCase(), horizontalPadding, startY + contentHeight + 64);
  context.font = "700 25px Inter, sans-serif";
  context.fillText("ALEX SAID", horizontalPadding, height - 92);
  context.textAlign = "right";
  context.fillText("UNOFFICIAL FAN APP", width - horizontalPadding, height - 92);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not render share card")), "image/png", 1);
  });
}

export async function downloadShareCard(quote: Quote, format: ShareCardFormat) {
  const blob = await renderShareCardBlob(quote, format);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `hormozi-said-${quote.id}-${format}.png`;
  anchor.click();
  URL.revokeObjectURL(url);
}
