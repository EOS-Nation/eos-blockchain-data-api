import { fileURLToPath } from "node:url";
import path from "node:path";

export function timeout(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve(true);
    }, ms);
  })
}

export function parseTimestamp( timestamp: string ) {
  return timestamp.split(".")[0];
}


export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

