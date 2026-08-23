import { pushEnabled } from "@/lib/push";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = request.headers.get("x-vercel-id");
  console.log(JSON.stringify({ level: "info", message: "daily quote cron started", route: "/api/cron/daily-quotes", requestId }));
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    console.error(JSON.stringify({ level: "error", message: "daily quote cron unauthorized", route: "/api/cron/daily-quotes", requestId, duration_ms: Date.now() - startedAt }));
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!pushEnabled) {
    console.log(JSON.stringify({ level: "info", message: "daily quote cron disabled", route: "/api/cron/daily-quotes", requestId, duration_ms: Date.now() - startedAt }));
    return Response.json({ status: "disabled", delivered: 0 });
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return Response.json({ error: "Push delivery dependencies are not configured" }, { status: 503 });
  }
  return Response.json({ error: "Supabase adapter activation is pending" }, { status: 501 });
}
