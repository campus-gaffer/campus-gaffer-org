import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";

export default function SyncUser() {
  const { user, isLoaded, isSignedIn } = useUser();
  const syncStarted = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && user && !syncStarted.current) {
      syncStarted.current = true;
      
      const sync = async () => {
        try {
          const response = await fetch("http://localhost:8081/auth/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              clerk_id: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              username: user.username || user.firstName || "Gaffer",
            }),
          });

          if (!response.ok) {
            console.error("Failed to sync user with backend");
          } else {
            console.log("User synced successfully");
          }
        } catch (error) {
          console.error("Error syncing user:", error);
        }
      };

      sync();
    }
  }, [isLoaded, isSignedIn, user]);

  return null;
}
