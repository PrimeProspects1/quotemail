import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname ?? "";
  const isLocalhost = LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);

  // On localhost we can use lax/non-secure cookies for dev convenience.
  // On any deployed domain (always HTTPS) we must set secure:true so that
  // SameSite:none is honoured — Safari silently drops cookies where
  // SameSite=none but secure is false.
  const secure = isLocalhost ? isSecureRequest(req) : true;
  const sameSite = isLocalhost ? ("lax" as const) : ("none" as const);

  return {
    httpOnly: true,
    path: "/",
    sameSite,
    secure,
  };
}
