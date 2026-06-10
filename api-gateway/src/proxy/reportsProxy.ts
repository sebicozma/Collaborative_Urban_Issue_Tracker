import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config";

export const reportsProxy = createProxyMiddleware({
  target: config.reportsServer.baseUrl,
  changeOrigin: true,
  pathRewrite: { "^/api/reports": "" },
});
