# Market Street

Multiplayer 3D lifestyle game where Ghanaian youth run market stalls and take real-life business challenges. This repo is the mobile-first web client. A 3D street (React Three Fiber) and a Supabase backend come later; build the UI so they can plug in.

## Stack
Vite, React 19, TypeScript (strict), Tailwind v4 plus the existing CSS tokens. Package manager: pnpm. Do not add a dependency without saying why in your summary.

## Commands
- pnpm dev  runs the app
- pnpm build  must pass before you finish any task

## Folder structure (keep it)
src/main.tsx and src/App.tsx stay as entry points.
src/screens/      one file per screen
src/components/ui/     Button, Pill, Icon, TopBar and other small parts
src/components/scene/  AppFrame, MarketBackdrop, MiniMap, Brand
src/data/         static content: products, groups, upgrades, challenges
src/state/        game state (coins, stall, round, group, avatar)
src/lib/          pure helpers, including economy.ts
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
