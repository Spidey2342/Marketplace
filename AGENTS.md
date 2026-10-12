# Market Street

Multiplayer 3D lifestyle game where Ghanaian youth run market stalls and take real-life business challenges. This repo is the mobile-first web client. The Town HUD sits on a React Three Fiber street. Supabase is optional. Without the two public keys the game stays on this device.

## Stack
Vite, React 19, TypeScript (strict), Tailwind v4, Three.js with React Three Fiber, plus the existing CSS tokens. Package manager: pnpm. Do not add a dependency without saying why in your summary.

## Commands
- pnpm dev  runs the app
- pnpm build  must pass before you finish any task

## Folder structure (keep it)
src/main.tsx and src/App.tsx stay as entry points.
src/screens/      one file per screen
src/components/ui/     Button, Pill, Icon, TopBar and other small parts
src/components/scene/  AppFrame, MarketBackdrop, MiniMap, Brand
src/data/         static content: products, groups, upgrades, challenges
src/state/        game state (coins, stall, round, group, avatar) and input.ts for the joystick
src/lib/          pure helpers, including economy.ts
src/scene3d/      TownCanvas and the street scene. Loaded only on the Town screen.
src/styles/       tokens.css plus one CSS file per screen or component group

## Rules
1. One component per file, default export, filename matches the component.
2. When you change a file, return the complete file contents, never partial snippets.
3. Responsive layout is required: phone portrait (360 x 800) first, then up to 480 px wide, then a centered layout on laptops.
4. Tap targets at least 48 px. Body text at least 16 px, labels at least 14 px. Thumb-reachable primary actions at the bottom.
5. Respect safe areas: use env(safe-area-inset-*) on all fixed top and bottom UI.
6. Never hardcode a number that comes from the game (coins, prices, timers). Read it from state or src/data.
7. Keep the look: colors, fonts and kente trims come from the existing CSS tokens. Do not restyle screens you were not asked to touch.
8. Safety: preset chat only, no exact location anywhere, no real-money features, no betting-style mechanics.
9. Copy: short, warm, Ghanaian (cedis shown as ¢, light slang like Chale and Ei). No lectures.
10. Do one task per prompt. Run pnpm build, then end with a short summary: files changed, anything you were unsure about.

## 3D rules
1. Build objects from primitives and shared materials. No external models yet.
2. Never allocate objects inside useFrame.
3. Never keep per-frame values in React state. Use refs.
4. Triangle budget: 100,000.
5. Cap the pixel ratio at 1.5.
6. Unmount the Canvas when leaving the Town screen.

## Backend rules
1. Never use or mention the service_role key in client code. The app only uses the anon key.
2. Every table has row level security. The app does not turn it off.
3. The game keeps working offline from local state when the keys are missing or the network fails.
4. Store the minimum personal data: nickname and avatar only. No email, no phone number, no exact location.
