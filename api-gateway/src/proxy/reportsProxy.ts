import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config";

export const reportsProxy = createProxyMiddleware({
  target: config.reportsServer.baseUrl,
  changeOrigin: true,
  // Express strips the mount prefix (/reports or /api/reports) before this proxy
  // runs, leaving only the remainder ("/", "/{id}", "/{id}/status", "/?query").
  // Re-prefix it so the reports-service receives /reports/* — its actual base path.
  // (Avoid emitting a trailing slash like "/reports/", which Spring 6 won't match.)
  pathRewrite: (path) => {
    if (path === "/") return "/reports";
    if (path.startsWith("/?")) return "/reports" + path.slice(1);
    return "/reports" + path;
  },
});
