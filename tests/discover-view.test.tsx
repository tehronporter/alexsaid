import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DiscoverView } from "@/components/discover-view";
import { UserStateProvider } from "@/components/user-state-provider";
import { catalog } from "@/lib/catalog";

vi.mock("@vercel/analytics", () => ({ track: vi.fn() }));

function renderDiscover(initialTopic = "") {
  return render(
    <UserStateProvider>
      <DiscoverView
        quotes={catalog.quotes}
        categories={catalog.categories}
        collections={catalog.collections}
        initialTopic={initialTopic}
      />
    </UserStateProvider>,
  );
}

describe("DiscoverView", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());

  it("surfaces topics, collections, and recent quotes by default", () => {
    renderDiscover();

    expect(screen.getByRole("heading", { name: "Browse topics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Latest quotes" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Collections" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Business Building/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Better Decisions/ }).length).toBeGreaterThan(0);
  });

  it("searches tags and provides a clear reset action", async () => {
    const user = userEvent.setup();
    renderDiscover();

    const search = screen.getByRole("searchbox", { name: "Search quotes" });
    await user.type(search, "revenue retention");
    expect(await screen.findByText("If you do not have what's called revenue retention, you have nothing.")).toBeInTheDocument();
    expect(screen.getByText(/^\d+ results?$/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(search).toHaveValue("");
    expect(screen.getByRole("heading", { name: "Browse topics" })).toBeInTheDocument();
  });

  it("offers useful recovery themes when a search has no results", async () => {
    const user = userEvent.setup();
    renderDiscover();

    await user.type(screen.getByRole("searchbox", { name: "Search quotes" }), "definitely-not-a-topic");
    expect(await screen.findByText("No matching quotes.")).toBeInTheDocument();
    expect(screen.getAllByRole("button").length).toBeGreaterThan(1);
  });
});
