export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  reportsServer: {
    baseUrl: process.env.REPORTS_SERVER_URL ?? "http://localhost:8081",
  },
  identityServer: {
    baseUrl: process.env.IDENTITY_SERVER_URL ?? "http://localhost:5000",
  },
};
