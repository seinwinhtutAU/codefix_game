// game/events.ts
import mitt from "mitt";
import { GameNotificationProps } from "./components/GameNotification";
import { CurrentTask, IGameProgress } from "@/lib/types";

type Events = {
  "ui-reset-start": void;
  "ui-open-problem": { problemId: string; difficulty: string };
  "ui-close-problem": void;
  "ui-open-quiz": void;
  "ui-close-quiz": void;
  "quiz-completed": { score: number; total: number };
  "show-notification": GameNotificationProps;
  "hide-notification": void;
  "play-ui-sound": string;
  "ui-toggle-pause": boolean;
  "ui-action": string;
  "ui-toggle-mute": boolean;
  "ui-scene": string;
  "request-current-scene": void;
  "start-scene-progress": IGameProgress;
  "problem-solved": { currentTask: CurrentTask };
  "problem-update-progress": IGameProgress;
  "resume-after-solve": IGameProgress;
  "progress-updated": IGameProgress;
  "bug-count-submitted": { timeLimit: number; estPoints: number };
};

export const EventBus = mitt<Events>();
