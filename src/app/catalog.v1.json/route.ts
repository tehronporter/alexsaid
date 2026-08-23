export async function GET(request: Request) {
  return Response.redirect(new URL("/catalog.v2.json", request.url), 308);
}
