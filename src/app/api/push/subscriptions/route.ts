import { z } from "zod";
import { pushEnabled } from "@/lib/push";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  timezone: z.string().min(1).max(100),
  localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  topics: z.array(z.string().min(1)).max(20)
});

function log(level: "info" | "error", message: string, request: Request, extra: Record<string, unknown> = {}) {
  console[level](JSON.stringify({ level, message, route: "/api/push/subscriptions", requestId: request.headers.get("x-vercel-id"), ...extra }));
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  log("info", "subscription request started", request);
  if (!pushEnabled) {
    log("info", "subscription request skipped; push disabled", request, { duration_ms: Date.now() - startedAt });
    return Response.json({ error: "Scheduled push is not active" }, { status: 503 });
  }
  try {
    subscriptionSchema.parse(await request.json());
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      log("error", "push storage is not configured", request, { duration_ms: Date.now() - startedAt });
      return Response.json({ error: "Push storage is not configured" }, { status: 503 });
    }
    return Response.json({ error: "Supabase adapter activation is pending" }, { status: 501 });
  } catch (error) {
    log("error", "invalid subscription request", request, { error: error instanceof Error ? error.message : String(error), duration_ms: Date.now() - startedAt });
    return Response.json({ error: "Invalid subscription" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  log("info", "unsubscribe requested", request);
  if (!pushEnabled) return Response.json({ error: "Scheduled push is not active" }, { status: 503 });
  return Response.json({ error: "Supabase adapter activation is pending" }, { status: 501 });
}
