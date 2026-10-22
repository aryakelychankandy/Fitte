// Copies the on-device face + body detection files from node_modules into
// public/mediapipe so the camera features work fully offline (no CDN).
// Runs automatically on `npm install`, `npm run dev` and `npm run build`.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const jobs = [
  { pkg: "pose", skip: /pose_landmark_heavy\.tflite$/ },
  { pkg: "face_mesh", skip: /\.d\.ts$|README/ },
];

for (const { pkg, skip } of jobs) {
  const from = join(root, "node_modules", "@mediapipe", pkg);
  const to = join(root, "public", "mediapipe", pkg);
  if (!existsSync(from)) {
    console.warn(`[drift] @mediapipe/${pkg} is not installed yet - camera detection will fall back to manual choices.`);
    continue;
  }
  mkdirSync(to, { recursive: true });
  for (const f of readdirSync(from)) {
    if (/\.d\.ts$|README|package\.json/.test(f) || (skip && skip.test(f))) continue;
    const dest = join(to, f);
    if (!existsSync(dest)) cpSync(join(from, f), dest);
  }
}
console.log("[drift] on-device detection files ready in public/mediapipe");
