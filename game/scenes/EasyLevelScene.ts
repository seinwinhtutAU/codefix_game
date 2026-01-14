import AudioManager from "../AudioManager";
import GameScene from "./GameScene";
import { checkExistingSolveRecord } from "@/services/problem";
import { EventBus } from "@/game/events";
import { IGameProgress } from "@/lib/types";

export interface SolvedPointStatus {
  attempts: number;
  isSolved: boolean;
}

export default class EasyLevelScene extends GameScene {
  private problemIds: string[] = [
    "69582fb37538b18589a46564",
    "695c13b389e02a7e13dbe5ca",
    "695e95e4c887fa19a718db13",
    // "69582fb37538b18589a46564",
    // "69582fb37538b18589a46564",
    // "69582fb37538b18589a46564",
    // "69582fb37538b18589a46564",
    // "695c13b389e02a7e13dbe5ca",
    // "695c13b389e02a7e13dbe5ca",
  ];

  private roadPoints = [
    { x: 230, y: 640 },
    { x: 130, y: 550 },
    { x: 140, y: 380 },
    // { x: 250, y: 300 },
    // { x: 450, y: 400 },
    // { x: 680, y: 450 },
    // { x: 920, y: 400 },
    // { x: 1100, y: 300 },
    // { x: 1230, y: 450 },
    // { x: 1150, y: 640 },
  ];

  private currentPointIndex = 0;
  private mapPoints: Phaser.GameObjects.Image[] = [];
  private solvedPoints: SolvedPointStatus[] = [];
  private maxAttempt = 5;
  private easylevelCompleted = false;
  private listenResum = false;

  constructor() {
    super("EasyLevelScene");
  }

  preload() {
    this.load.image("easy-map", "/easy/map.png");
    this.load.image("easy-circle", "/easy/circle.png");
    this.load.image("easy-circle-current", "/easy/circle_current.png");
    this.load.image("easy-lock", "/easy/lock.png");
    this.load.image("easy-unlock", "/easy/unlock.png");
  }

  async create() {
    super.create();
    console.log(
      "Before EasyLevelScene: ",
      JSON.stringify(this.savedProgress, null, 2)
    );

    this.initAudio();
    this.initSolvedPoints();
    this.drawMapAndPoints();
    await this.updateAllSolvePoint();
    this.updatePointUI();
    this.setUpListener();
    this.handleProgressResume(this.savedProgress);

    console.log(
      "After EasyLevelScene: ",
      JSON.stringify(this.savedProgress, null, 2)
    );
  }

  update() {}

  private handleProgressResume = async (progress: IGameProgress) => {
    const { currentTask } = progress.gameState;

    const index = currentTask.currentActiveIndex ?? 0;
    const completedIndex = index - 1;
    const userId = progress.userId;

    const solveRecord = await this.checkPointSolved(
      userId,
      this.problemIds[completedIndex]
    );

    const attempts = solveRecord?.attempt ?? 0;
    const isSolved = solveRecord ? true : false;

    this.updateSolvedPoint(completedIndex, attempts, isSolved);

    // this.updateAllSolvePoint();

    const currentUpdated = this.updateCurrentPointIndex(completedIndex);
    if (
      this.listenResum &&
      currentUpdated &&
      this.currentPointIndex < this.mapPoints.length
    ) {
      this.emitTaskStarted(progress);
    }

    if (!this.easylevelCompleted && this.checkLevelCompleted()) {
      this.easylevelCompleted = true;

      this.emitLevelCompleted(progress);
      EventBus.emit("show-notification", {
        type: "LEVEL_UP",
        title: "Level Up!",
        message: "New challenges unlocked.",
        confirmLabel: "NEXT",
        onConfirm: () => {
          EventBus.emit("hide-notification");
          this.scene.start("MiddleLevelScene", this.savedProgress);
        },
      });
    }

    this.updatePointUI();
  };

  private async checkPointSolved(userId: string, problemId: string) {
    const response = await checkExistingSolveRecord(userId, problemId);
    return response?.data;
  }

  private setUpListener() {
    EventBus.on("resume-after-solve", (progress) => {
      this.listenResum = true;
      this.handleProgressResume(progress);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off("resume-after-solve", this.handleProgressResume);
    });
  }

  private initAudio() {
    const audioManager = AudioManager.getInstance();
    audioManager.init(this.game);
    audioManager.playMusic("bgm", { volume: 0.15, loop: true });
  }

  private drawMapAndPoints() {
    if (this.mapPoints.length > 0) return;

    this.add.image(0, 0, "easy-map").setOrigin(0, 0);

    this.roadPoints.forEach((value, index) => {
      const point = this.add
        .image(value.x, value.y, "easy-circle")
        .setDisplaySize(100, 70);

      point.on("pointerdown", () => {
        if (index !== this.currentPointIndex) return;

        EventBus.emit("ui-open-problem", this.problemIds[index]);
      });

      this.mapPoints.push(point);
    });
  }

  private initSolvedPoints() {
    for (let i = 0; i < this.roadPoints.length; i++) {
      this.solvedPoints.push({ attempts: 0, isSolved: false });
    }
  }

  private updatePointUI() {
    this.mapPoints.forEach((point, index) => {
      const state = this.getPointState(index);

      point.disableInteractive();

      switch (state) {
        case "solved":
          point.setTint(0x00ff00);
          break;
        case "skipped":
          point.setTint(0xff0000);
          break;
        case "current":
          point.setTint(0xffff00);
          point.setInteractive({ useHandCursor: true });
          break;
        default:
          point.setTint(0x999999);
      }
    });
  }

  private getPointState(index: number) {
    if (index < 0 || index >= this.mapPoints.length) return "locked";

    const { attempts, isSolved } = this.solvedPoints[index];
    if (attempts >= this.maxAttempt) return "skipped";

    if (isSolved) return "solved";
    if (index === this.currentPointIndex) return "current";
    if (index > this.currentPointIndex) return "locked";
    return "locked";
  }

  private updateCurrentPointIndex(index: number): boolean {
    const state = this.getPointState(index);

    console.log("index: ", index);
    console.log("state: ", state);
    console.log("solved point: ", this.solvedPoints[index]);

    if (state === "skipped" || state === "solved") {
      this.currentPointIndex = index + 1;

      return true;
    }

    return false;
  }

  private emitTaskStarted(progress: IGameProgress) {
    console.log("emitTaskStarted");
    EventBus.emit("progress-updated", {
      ...progress,
      gameState: {
        ...progress.gameState,
        currentTask: {
          ...progress.gameState.currentTask,
          taskType: "code_problem",
          status: "in_progress",
          attempts: 0,
          highestHintLevelUsed: "none",
          hintUsages: [],
        },
      },
    });
  }

  private emitLevelCompleted(progress: IGameProgress) {
    EventBus.emit("progress-updated", {
      ...progress,
      gameState: {
        currentScene: "MediumLevelScene",
        eventFlags: {
          ...progress.gameState.eventFlags,
          easyLevelCompleted: true,
        },
        currentTask: {
          taskType: "none",
          taskId: undefined,
          status: "none",
          attempts: 0,
          timer: 0,
          currentActiveIndex: 0,
          highestHintLevelUsed: "none",
          hintUsages: [],
        },
      },
    });
  }

  private updateSolvedPoint(
    index: number,
    attempts: number,
    isSolved: boolean
  ) {
    if (index < 0 || index >= this.mapPoints.length) return;

    this.solvedPoints[index] = {
      attempts,
      isSolved,
    };
  }

  private async updateAllSolvePoint() {
    const userId = this.savedProgress.userId;

    await Promise.all(
      this.problemIds.map(async (id, index) => {
        const solveRecord = await this.checkPointSolved(userId, id);
        this.solvedPoints[index] = {
          attempts: solveRecord?.attempt ?? 0,
          isSolved: !!solveRecord,
        };
      })
    );
  }

  private checkLevelCompleted(): boolean {
    let countOfSolved = 0;
    this.solvedPoints.forEach((status) => {
      if (status.isSolved) countOfSolved++;
    });

    if (countOfSolved === this.solvedPoints.length) {
      return true;
    }

    return false;
  }
}
