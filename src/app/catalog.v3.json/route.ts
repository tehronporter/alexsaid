import { catalogV3 } from "@/lib/catalog";

export async function GET() {
  return Response.json(catalogV3, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
