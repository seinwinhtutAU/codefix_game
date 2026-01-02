const fetchAllProblems = async () => {
  try {
    const response = await fetch("/api/problems", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // Returns the problems data
  } catch (error) {
    console.error("Error fetching problems:", error);
    throw error;
  }
};
