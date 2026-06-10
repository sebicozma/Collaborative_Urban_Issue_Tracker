import express from "express";
import { globalLimiter } from "./middleware/rateLimiter";
import { reportsProxy } from "./proxy/reportsProxy";
import { identityProxy } from "./proxy/identityProxy";
import { authRouter } from "./routes/auth";

export const app = express();

app.use(globalLimiter);

// Routes from spec/gateway.openapi.yaml. Express strips the mount prefix, so the
// reports proxy re-adds /reports upstream (see reportsProxy.ts).
app.use("/auth", authRouter);
app.use("/reports", reportsProxy);

// Legacy prefix proxies.
app.use("/api/reports", reportsProxy);
app.use("/api/identity", identityProxy);
