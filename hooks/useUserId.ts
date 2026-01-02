import { useState, useEffect } from "react";

export function useUserId() {
  const [userId] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return "null";

      const user = JSON.parse(stored);
      return user.id || "null";
    } catch {
      return "null";
    }
  });

  return userId;
}
