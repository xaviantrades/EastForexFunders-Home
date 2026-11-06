const ALLOWED = {
  "create-user": ["POST"],
  "users": ["GET"],
  "update-balance": ["PATCH"]
};

export async function onRequest(context) {
  const { request, env, params } = context;
  const pathParts = Array.isArray(params.path) ? params.path : [];
  if (pathParts.length !== 1 || !ALLOWED[pathParts[0]]) {
    return Response.json({ success: false, message: "Not found." }, { status: 404 });
  }

  const endpoint = pathParts[0];
  if (!ALLOWED[endpoint].includes(request.method)) {
    return Response.json({ success: false, message: "Method not allowed." }, {
      status: 405,
      headers: { Allow: ALLOWED[endpoint].join(", ") }
    });
  }

  const workerUrl = (env.WORKER_URL || "").trim().replace(/\/+$/, "");
  const adminKey = env.ADMIN_KEY;
  if (!workerUrl || !adminKey) {
    return Response.json({
      success: false,
      message: "Server connection is not configured. Add WORKER_URL and ADMIN_KEY in Cloudflare Pages settings."
    }, { status: 503 });
  }

  let target;
  try {
    target = new URL(workerUrl);
    if (target.protocol !== "https:") throw new Error("HTTPS required");
  } catch {
    return Response.json({ success: false, message: "WORKER_URL must be a valid HTTPS URL." }, { status: 500 });
  }

  const headers = new Headers();
  headers.set("X-Admin-Key", adminKey);
  const contentType = request.headers.get("Content-Type");
  if (contentType) headers.set("Content-Type", contentType);

  const upstreamUrl = new URL(`/api/admin/${endpoint}`, target.origin);
  const upstream = await fetch(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual"
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.delete("Set-Cookie");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}
