import { Router, json } from "express";
import { config } from "../config";

/**
 * Implements the /auth/* contract from spec/gateway.openapi.yaml by translating
 * the spec's JSON shapes onto the identity server's own endpoints:
 *
 *  - POST /auth/register -> POST /account/signup
 *  - POST /auth/token    -> POST /connect/token (resource-owner password grant)
 *
 * The spec authenticates by email, while ASP.NET Identity keys logins off the
 * username — so registration uses the email as the username, which makes the
 * password grant work with {email, password} afterwards.
 */
export const authRouter = Router();

// JSON parsing is scoped to this router so proxied routes keep streaming bodies.
authRouter.use(json());

authRouter.post("/register", async (req, res) => {
  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };

  const r = await fetch(`${config.identityServer.baseUrl}/account/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, email, password }),
  });
  const body = (await r.json()) as any;

  if (!r.ok) {
    res.status(r.status).json(body);
    return;
  }

  res.status(201).json({
    userId: body.userId,
    email: body.email,
    role: "citizen", // identity assigns every signup the citizen role
    createdAt: new Date().toISOString(),
  });
});

authRouter.post("/token", async (req, res) => {
  const { email, username, password } = (req.body ?? {}) as {
    email?: string;
    username?: string;
    password?: string;
  };

  const r = await fetch(`${config.identityServer.baseUrl}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: "urban-issues-mobile",
      username: email ?? username ?? "",
      password: password ?? "",
      scope: "openid urban-issues-api.read urban-issues-api.write offline_access",
    }),
  });
  const body = (await r.json()) as any;

  if (!r.ok) {
    res.status(401).json({
      type: "https://api.urbanpulse.example.com/errors/unauthorized",
      title: "Authentication failed",
      status: 401,
      detail: body.error_description ?? body.error ?? "Invalid credentials",
    });
    return;
  }

  res.json({
    accessToken: body.access_token,
    tokenType: "Bearer",
    expiresIn: body.expires_in,
  });
});
