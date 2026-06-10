import express from "express";
import { globalLimiter } from "./middleware/rateLimiter";
import { reportsProxy } from "./proxy/reportsProxy";
import { identityProxy } from "./proxy/identityProxy";
import { authRouter } from "./routes/auth";

export const app = express();

app.use(globalLimiter);

// Routes from spec/gateway.openapi.yaml. The reports proxy is mounted without a
// rewrite here: /reports/* maps 1:1 onto the reports service's own /reports/*.
app.use("/auth", authRouter);
app.use("/reports", reportsProxy);

// Legacy prefix proxies.
app.use("/api/reports", reportsProxy);
app.use("/api/identity", identityProxy);
