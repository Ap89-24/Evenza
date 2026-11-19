"use client";

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Robust auth wrapper: tries template "convex", falls back to standard session token
function useConvexClerkAuth() {
  const clerkAuth = useAuth();
  return {
    ...clerkAuth,
    getToken: async (args) => {
      try {
        const templateToken = await clerkAuth.getToken({ template: "convex" });
        if (templateToken) return templateToken;
      } catch (err) {
        // Fall back to standard session token if "convex" template is not in Clerk Dashboard
      }
      return await clerkAuth.getToken();
    },
  };
}

export function ConvexClientProvider({ children }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useConvexClerkAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
