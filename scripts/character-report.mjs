#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const modelDir = path.join(root, "public", "models", "characters")
const placeholder = path.join(modelDir, "placeholder.glb")
const bin = path.join(root, "node_modules", ".bin", "gltf-transform")

function fileKb(filePath) {
  return Math.round(fs.statSync(filePath).size / 1024)
}

function inspect(filePath) {
  const out = spawnSync(bin, ["inspect", filePath], { encoding: "utf8", shell: true })
  return out.stdout ?? ""
}

const text = inspect(placeholder)
const vertexMatch = text.match(/\│\s*([\d,]+)\s*\│\s*[\d,]+\s*\│\s*[\d,]+\s*\│/)
const renderVerts = vertexMatch ? Number(vertexMatch[1].replace(/,/g, "")) : 14016
const trisPerChar = Math.round(renderVerts / 3)

const files = fs
  .readdirSync(modelDir)
  .filter((name) => name.endsWith(".glb"))
  .map((name) => ({ name, kb: fileKb(path.join(modelDir, name)) }))

console.log("Character asset report")
console.log("Placeholder: Khronos CesiumMan (CC BY 4.0)")
console.log("")
for (const file of files) {
  console.log(`- ${file.name}: ${file.kb} KB`)
}
console.log("")
console.log(`Triangles per character (render verts / 3): ~${trisPerChar}`)
console.log(`20 characters (same mesh): ~${trisPerChar * 20} triangles`)
console.log(`Crowd budget target: 60,000 triangles`)
console.log("")
console.log(
  "FPS with 20 characters: run Town with dev tools, quality High, and check the FPS pill (target 30+ on a mid phone).",
)
