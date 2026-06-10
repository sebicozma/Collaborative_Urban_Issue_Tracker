import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config";

export const identityProxy = createProxyMiddleware({
  target: config.identityServer.baseUrl,
  changeOrigin: true,
  pathRewrite: { "^/api/identity": "" },
});
