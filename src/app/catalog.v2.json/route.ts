import { catalog } from "@/lib/catalog";

export async function GET() {
  return Response.json(catalog, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
