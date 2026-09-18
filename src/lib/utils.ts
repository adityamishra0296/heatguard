import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names and resolve Tailwind CSS utility conflicts.
 *
 * Combines `clsx` (conditional/array/object class composition) with
 * `tailwind-merge` (last-wins resolution of conflicting Tailwind utilities),
 * e.g. `cn("px-2", "px-4")` → `"px-4"`.
 *
 * @param inputs - Class values: strings, arrays, or conditional objects.
 * @returns A single, de-duplicated className string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
