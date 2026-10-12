/** Joystick and keyboard, stored on a ref so walking does not re-render React. */
export const input = {
  x: 0,
  y: 0,
  glideHome: false,
}

export function setMove(x: number, y: number) {
  input.x = x
  input.y = y
  if (x !== 0 || y !== 0) input.glideHome = false
}

export function requestGlideHome() {
  input.glideHome = true
  input.x = 0
  input.y = 0
}

export function clearGlide() {
  input.glideHome = false
}
