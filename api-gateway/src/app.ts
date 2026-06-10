import express from "express";
import { globalLimiter } from "./middleware/rateLimiter";
import { reportsProxy } from "./proxy/reportsProxy";
import { identityProxy } from "./proxy/identityProxy";

export const app = express();

app.use(globalLimiter);
app.use("/api/reports", reportsProxy);
app.use("/api/identity", identityProxy);
