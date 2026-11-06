// The owner's web client, built into web/dist and served beside the doors. Only its own files: one page at /, its hashed
// assets, and nothing else — every other path belongs to the kernel's doors, so a lost page answers like any unknown path.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const DIST = join(import.meta.dirname, "..", "web", "dist");
const ASSET = /^\/assets\/[A-Za-z0-9._-]+$/;
const TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

// The page runs only what is served beside it and talks only to the hub itself; no form posts anywhere.
const PAGE_POLICY =
  "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; " +
  "base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

export function pages(handle: (request: Request) => Promise<Response>): (request: Request) => Promise<Response> {
  return async (request) => {
    const path = new URL(request.url).pathname;
    if (request.method !== "GET" || (path !== "/" && !ASSET.test(path))) return handle(request);
    try {
      const body = await readFile(join(DIST, path === "/" ? "index.html" : path.slice(1)));
      const kind =
        path === "/"
          ? "text/html; charset=utf-8"
          : (TYPES[path.slice(path.lastIndexOf("."))] ?? "application/octet-stream");
      return new Response(body, {
        headers: {
          "content-type": kind,
          // Assets carry a content hash in their name, so they may be kept forever; the page itself must revalidate.
          "cache-control": path === "/" ? "no-store" : "public, max-age=31536000, immutable",
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer",
          "content-security-policy": PAGE_POLICY,
        },
      });
    } catch {
      return handle(request);
    }
  };
}
