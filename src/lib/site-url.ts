const LOCAL_SITE_URL = "http://localhost:3000";

function normalizeSiteUrl(value: string) {
  const siteUrl = value.trim().replace(/\/+$/, "");
  if (!siteUrl) return null;
  return /^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`;
}

export function getSiteUrl() {
  const configuredUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (configuredUrl) return configuredUrl;

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  return vercelHost ? `https://${vercelHost}` : LOCAL_SITE_URL;
}
