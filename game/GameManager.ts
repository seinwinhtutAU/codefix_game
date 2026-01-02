export const GameManager = {
  saveGameState: (scene: Phaser.Scene, player: { x: number; y: number }) => {
    const data = {
      sceneKey: scene.scene.key,
      x: player.x,
      y: player.y,
      timestamp: Date.now(),
    };
    localStorage.setItem("phaser_recovery_state", JSON.stringify(data));
  },

  // Get the state back
  getSavedState: () => {
    const saved = localStorage.getItem("phaser_recovery_state");
    if (!saved) return null;

    // Only allow recovery if it's been less than 30 mins
    const data = JSON.parse(saved);
    if (Date.now() - data.timestamp > 30 * 60 * 1000) {
      localStorage.removeItem("phaser_recovery_state");
      return null;
    }
    return data;
  },

  clearState: () => localStorage.removeItem("phaser_recovery_state"),
};
