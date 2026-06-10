import http from "node:http";
import { app } from "./app";
import { attachWsProxy } from "./proxy/wsProxy";
import { config } from "./config";

const server = http.createServer(app);
attachWsProxy(server);

server.listen(config.port, () => {
  console.log(`API Gateway running on http://localhost:${config.port}`);
});
