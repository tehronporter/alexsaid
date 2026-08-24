import type { Quote } from "@/domain/catalog";

export function verificationLabel(quote: Pick<Quote, "verified" | "verificationStandard">, detailed = false) {
  if (!quote.verified) return "Verification pending";
  if (quote.verificationStandard === "official-transcript-reviewed") {
    return detailed ? "●  Reviewed against the official timestamped transcript" : "●  Official transcript reviewed";
  }
  return detailed ? "●  Checked twice against the original source" : "●  Checked twice";
}
