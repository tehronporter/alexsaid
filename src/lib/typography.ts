/**
 * Display sizing for quote text.
 *
 * Quote length varies wildly (a six-word line next to a forty-word passage), so a
 * fixed size either shrinks the short ones into anticlimax or pushes the long ones
 * past the fold. Pick the ramp from the character count.
 *
 * `stage` is the full-bleed quote feed — it spans the viewport at every breakpoint,
 * so viewport units track it directly.
 *
 * `panel` is the source page, which is full-width on phones but drops into a narrow
 * column at `lg`. Viewport units can't express that break, so it steps through
 * breakpoints instead: full impact on mobile, restrained inside the desktop column.
 */
export function quoteDisplaySize(text: string, variant: "stage" | "panel" = "stage") {
  const long = text.length > 110;
  const medium = text.length > 75;
  if (variant === "panel") {
    if (long) return "text-5xl sm:text-6xl lg:text-[2.5rem] xl:text-[2.75rem]";
    return medium
      ? "text-6xl sm:text-7xl lg:text-[3rem] xl:text-[3.5rem]"
      : "text-6xl sm:text-8xl lg:text-5xl xl:text-6xl";
  }
  if (long) return "text-[clamp(1.75rem,5.2vw,5rem)]";
  return medium ? "text-[clamp(2.2rem,6vw,6.5rem)]" : "text-[clamp(3rem,7.5vw,8.5rem)]";
}
