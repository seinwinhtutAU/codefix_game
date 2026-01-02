import * as Phaser from "phaser";

export const EventBus = new Phaser.Events.EventEmitter();

export type SceneState = "MENU" | "GAME" | "HIDDEN";

export const getGlobalScore = () =>
  Number(localStorage.getItem("current_score") || "0");
export const setGlobalScore = (val: number) =>
  localStorage.setItem("current_score", val.toString());
