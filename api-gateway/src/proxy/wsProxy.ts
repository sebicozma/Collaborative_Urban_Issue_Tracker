import { Server } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config";

const wsProxy = createProxyMiddleware({
  target: config.reportsServer.baseUrl,
  ws: true,
  changeOrigin: true,
});

export function attachWsProxy(server: Server) {
  server.on("upgrade", wsProxy.upgrade);
}
