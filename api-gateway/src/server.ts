import http from "node:http";
import { app } from "./app";
import { config } from "./config";

const server = http.createServer(app);

server.listen(config.port, () => {
  console.log(`API Gateway running on http://localhost:${config.port}`);
});
