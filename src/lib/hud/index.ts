import { HudController } from "./controller.svelte";
export const controller = new HudController();
export const create = (message: string) => controller.add(message);
