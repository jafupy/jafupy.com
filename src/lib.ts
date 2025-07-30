import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
export const logo =
  "https://utfs.io/f/d9850d67-72a8-49ad-898e-0fb355fd9671-1zbfv.svg";
