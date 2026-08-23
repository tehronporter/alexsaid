import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuoteListCard } from "@/components/quote-list-card";
import { UserStateProvider } from "@/components/user-state-provider";
import { catalog } from "@/lib/catalog";
import { LOCAL_STATE_KEY } from "@/lib/local-state";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

describe("QuoteListCard", () => {
  beforeEach(() => localStorage.clear());
  it("saves the exact quote ID to device-local state", async () => {
    const quote = catalog.quotes[0];
    render(<UserStateProvider><QuoteListCard quote={quote} /></UserStateProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Save quote" }));
    expect(localStorage.getItem(LOCAL_STATE_KEY)).toContain(quote.id);
    expect(screen.getByRole("button", { name: "Remove from saved" })).toBeInTheDocument();
  });
});
