# Character models

Final art drops here. Until then the app loads `placeholder.glb` (Khronos **CesiumMan**, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)) as `base_slim.glb`, `base_medium.glb`, and `base_broad.glb`.

## Delivery format

| Asset | File | Triangle budget | File size budget |
| --- | --- | --- | --- |
| Base body (×3) | `base_slim.glb`, `base_medium.glb`, `base_broad.glb` | 8,000 each (showcase) | 600 KB each |
| Outfit pack | `outfit_<name>.glb` optional | part of LOD | 150 KB each |

All bodies share one **humanoid skeleton** (same bone names and rest pose).

### Mesh naming

- Skin / body: `skin` or `body_*`
- Hair: `hair_<id>` (e.g. `hair_short`, `hair_puff`)
- Tops: `top_<outfitId>`
- Bottoms: `bottom_<outfitId>` (optional)
- Shoes: `shoes_<id>`
- Accessories: `accessory_<id>`

Only one mesh per part type should be visible; the client hides the rest.

### Materials

- **Skin tone** is a tint on materials whose names include `skin` or `body`, or the default body material when no parts exist.
- **Outfit colors** tint `top_*` / `bottom_*` meshes when no texture is authored.
- At most **one 1024×1024 texture atlas** per character set.

### Animations (exact clip names)

| Name | Use |
| --- | --- |
| `idle` | Standing |
| `walk` | Joystick movement |
| `run` | Fast movement |
| `wave` | Emote wheel |
| `cheer` | Emote wheel |
| `sell_call` | Auto while stall is open |
| `buy` | Player bought from a neighbor |

Use **glTF 2.0** binary (`.glb`). **Draco** and **meshopt** compression are supported.

## Compress before shipping

From the repo root:

```bash
pnpm compress:character public/models/characters/base_medium.glb public/models/characters/base_medium.glb
```

Or manually:

```bash
pnpm exec gltf-transform optimize IN.glb OUT.glb --compress draco meshopt --texture-compress webp --texture-size 1024
```

Targets: **600 KB** base, **150 KB** per outfit pack.

## LOD (artist-authored later)

| LOD | Distance | Triangle cap | Notes |
| --- | --- | --- | --- |
| Showcase | Avatar screen | 8,000 | Full quality, rim light |
| Street near | ≤ 15 m | 4,000 | Full animation |
| Street far | > 15 m | 2,000 | 10 fps or frozen |

Until separate LOD files exist, the client reuses the same mesh and throttles animation on far LOD.
