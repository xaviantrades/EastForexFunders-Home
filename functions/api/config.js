export async function onRequest({ env }) {
  const configured = Boolean((env.WORKER_URL || "").trim() && env.ADMIN_KEY);
  return Response.json(
    { success: true, configured },
    { headers: { "Cache-Control": "no-store" } }
  );
}
