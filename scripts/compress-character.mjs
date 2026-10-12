#!/usr/bin/env node
/**
 * Compress a character GLB for shipping.
 * Usage: pnpm compress:character <input.glb> [output.glb]
 */
import { spawnSync } from "node:child_process"
import path from "node:path"

const input = process.argv[2]
const output = process.argv[3] ?? input

if (!input) {
  console.error("Usage: pnpm compress:character <input.glb> [output.glb]")
  process.exit(1)
}

const bin = path.join(process.cwd(), "node_modules", ".bin", "gltf-transform")
const args = [
  "optimize",
  input,
  output,
  "--compress",
  "draco",
  "meshopt",
  "--texture-compress",
  "webp",
  "--texture-size",
  "1024",
]

const result = spawnSync(bin, args, { stdio: "inherit", shell: true })
process.exit(result.status ?? 1)
