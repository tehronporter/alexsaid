export type QuoteTypographyStyle = "xl" | "large" | "medium" | "small";

const quoteTypographyClasses: Record<"stage" | "panel", Record<QuoteTypographyStyle, string>> = {
  stage: {
    xl: "quote-copy quote-copy--xl",
    large: "quote-copy quote-copy--large",
    medium: "quote-copy quote-copy--medium",
    small: "quote-copy quote-copy--small",
  },
  panel: {
    xl: "quote-copy quote-panel-copy quote-copy--xl",
    large: "quote-copy quote-panel-copy quote-copy--large",
    medium: "quote-copy quote-panel-copy quote-copy--medium",
    small: "quote-copy quote-panel-copy quote-copy--small",
  },
};

export function quoteTypographyStyle(text: string): QuoteTypographyStyle {
  const length = text.trim().length;
  if (length <= 80) return "xl";
  if (length <= 150) return "large";
  if (length <= 240) return "medium";
  return "small";
}

export function quoteDisplaySize(text: string, variant: "stage" | "panel" = "stage") {
  return quoteTypographyClasses[variant][quoteTypographyStyle(text)];
}
