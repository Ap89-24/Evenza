// convex/auth.config.js
import { AuthConfig } from "convex/server";

const config = {
  providers: [
    ...(process.env.CLERK_JWT_ISSUER_DOMAIN
      ? [{ domain: process.env.CLERK_JWT_ISSUER_DOMAIN, applicationID: "convex" }]
      : []),
    {
      domain: "https://clerk.evenzza.in",
      applicationID: "convex",
    },
    {
      domain: "https://charming-mite-30.clerk.accounts.dev",
      applicationID: "convex",
    },
    {
      domain: "https://quiet-walleye-29.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};

export default config;
