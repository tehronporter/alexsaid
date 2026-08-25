import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl } from "@/lib/site-url";

describe("getSiteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes a configured public URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://alexsaid.vercel.app/");
    expect(getSiteUrl()).toBe("https://alexsaid.vercel.app");
  });

  it("falls back to the production Vercel host when the public URL is blank", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "alexsaid.vercel.app");
    expect(getSiteUrl()).toBe("https://alexsaid.vercel.app");
  });

  it("uses the local URL outside Vercel", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
