import { useState, useEffect } from "react";

export function useUserId() {
  const [userId, setUserId] = useState("null");

  /*
  Fetch and set the current user's ID.
  Fallback to "null" if not logged in or request fails.
  */
  useEffect(() => {
    let isMounted = true;

    async function loadUserId() {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) {
          if (isMounted) setUserId("null");
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setUserId(data?.user?.id || "null");
        }
      } catch {
        if (isMounted) setUserId("null");
      }
    }

    loadUserId();
    return () => {
      isMounted = false;
    };
  }, []);

  return userId;
}
