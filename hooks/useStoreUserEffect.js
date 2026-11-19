"use client";

import { useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function useStoreUserEffect() {
  const { user, isLoaded } = useUser();
  const [storedUserId, setStoredUserId] = useState(null);
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (!isLoaded || !user?.id) {
      return;
    }

    async function syncUser() {
      try {
        const id = await storeUser({
          clerkUserId: user.id,
          name: user.fullName || user.firstName || "Evenza User",
          email: user.primaryEmailAddress?.emailAddress || "",
          profileImageUrl: user.imageUrl || undefined,
        });
        setStoredUserId(id);
      } catch (err) {
        console.warn("Could not sync user to Convex:", err);
      }
    }

    syncUser();
  }, [isLoaded, user?.id, storeUser]);

  return {
    isLoading: !isLoaded,
    isAuthenticated: !!user?.id,
  };
}
