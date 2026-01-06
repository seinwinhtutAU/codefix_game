// game/events.ts
import mitt from "mitt";
import { GameNotificationProps } from "./components/GameNotification";
import { IGameProgress } from "@/lib/types";

type Events = {
  "ui-reset-start": void;
  "ui-open-problem": string;
  "show-notification": GameNotificationProps;
  "hide-notification": void;
  "play-ui-sound": string;
  "ui-toggle-pause": boolean;
  "ui-action": string;
  "ui-toggle-mute": boolean;
  "ui-scene": string;
  "request-current-scene": void;
  "start-scene": IGameProgress;
  "problem-solved": { id: string; attempt: number };
  "resume-after-solve": void;
};

export const EventBus = mitt<Events>();
