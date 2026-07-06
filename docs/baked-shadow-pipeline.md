# Baked Shadow Pipeline Notes

## Goal

Match the natural grounded look of Henry's site without relying on realtime Three.js shadows.

Henry's relevant implementation:

- `src/Application/Utils/BakedModel.ts`
- Uses `MeshBasicMaterial` with baked JPG textures.
- Sets `texture.flipY = false` and `texture.encoding = THREE.sRGBEncoding`.
- Replaces each mesh material with one baked texture material.
- Result: lighting, ambient occlusion, and contact shadows are already in the model texture.

## Current Jianwei Implementation

Runtime shadowing is intentionally absent:

- There are no `USE_REALTIME_SHADOWS` / `USE_RUNTIME_ROOM_SHADOWS` switches left in `SpatialPortfolio.ts`.
- `renderer.shadowMap.enabled = false`.
- No current `castShadow = true` / `receiveShadow = true` paths in `SpatialPortfolio.ts`.
- The former transparent `ShadowMaterial` receiver meshes for the entry floor and room floor are no longer created.

Current baked files:

- `public/textures/baked/real_room_floor_baked_surface.png` - runtime visible floor surface.
- `public/textures/baked/real_desk_baked_surface.png` - runtime visible desktop surface.
- `public/textures/baked/real_room_floor_shadow.png` - Blender/generated intermediate shadow map.
- `public/textures/baked/real_desk_surface_shadow.png` - Blender/generated intermediate shadow map.

The web scene draws two unlit baked planes:

- floor baked surface
- desk baked surface

The raw contact shadow maps are not drawn as separate runtime overlays anymore. They are composited into the surface textures offline, closer to Henry's "lighting already lives in the material" approach.

This is not as complete as Henry's full UV-baked model workflow, but it keeps the visible floor and desktop shadows offline-rendered by Blender.

## Blender Script

Current script:

`/.tmp-qa/bake_real_room_shadows_v2.py`

The v2 script reads `.tmp-qa/live_transforms.json`, exported from the running
web scene, so Blender bakes the same object placement as the site.

Useful commands:

```bash
node .tmp-qa/extract_live_transforms_playwright.mjs .tmp-qa/live_transforms.json
BAKE_TARGET=all /Applications/Blender.app/Contents/MacOS/Blender -b --python .tmp-qa/bake_real_room_shadows_v2.py
BAKE_TARGET=desk /Applications/Blender.app/Contents/MacOS/Blender -b --python .tmp-qa/bake_real_room_shadows_v2.py
BAKE_TARGET=surfaces /Applications/Blender.app/Contents/MacOS/Blender -b --python .tmp-qa/bake_real_room_shadows_v2.py
```

`BAKE_TARGET=all` rerenders shadow maps in Blender.

`BAKE_TARGET=desk` rerenders and recomposites the desktop receiver, including the extra pin-contact pass for small desk objects.

`BAKE_TARGET=surfaces` reuses the existing shadow maps and regenerates the composited surface textures.

## Latest QA

Latest screenshots:

- `.tmp-qa/rebake-v3b-overhead.png`
- `.tmp-qa/rebake-v3b-front.png`
- `.tmp-qa/baked-shadow-v32-floor-pin.png`
- `.tmp-qa/baked-shadow-v32-side.png`
- `.tmp-qa/baked-shadow-v31-final.png`
- `.tmp-qa/baked-shadow-v31-pin-contact.png`
- `.tmp-qa/baked-shadow-v30-production-restored.png`
- `.tmp-qa/baked-environment-v1-doorway.png` - rejected production experiment; hard beige receiver plane.
- `.tmp-qa/baked-environment-v1-room.png` - rejected production experiment; hard beige receiver plane.
- `.tmp-qa/blender-bake/jianwei_static_room_lightmap_preview.png` - full-room single-lightmap prototype.
- `.tmp-qa/blender-bake/jianwei_grouped_baked_room_preview.png` - Henry-style grouped lightmap prototype.
- `.tmp-qa/baked-shadow-v29-door.png`
- `.tmp-qa/baked-shadow-v29-doorway.png`
- `.tmp-qa/baked-shadow-v29-computer-close.png`
- `.tmp-qa/baked-shadow-v28-default.png`
- `.tmp-qa/baked-shadow-v28-desk-keyboard-clean.png`
- `.tmp-qa/baked-shadow-v28-side-clean.png`

Checks passed:

- v3 rebake: `npm run typecheck`
- v3 rebake: `npm run build`
- v32: `npm run typecheck`
- v32: `npm run build`
- v31: `npm run typecheck`
- v31: `npm run build`

v29 implementation note:

- `SpatialPortfolio.ts` now has no `USE_REALTIME_SHADOWS` or `USE_RUNTIME_ROOM_SHADOWS` switches.
- `renderer.shadowMap.enabled` is hard-disabled.
- `rg` check has no `ShadowMaterial`, `shadowMap.enabled = true`, `castShadow = true`, or `receiveShadow = true` in `SpatialPortfolio.ts`.
- The current visible room grounding comes from the two Blender-generated baked surface textures, not from Three.js realtime shadow maps.
- `USE_BAKED_ENVIRONMENT_MODEL = false`; the full-model prototype is not currently enabled in production.

v31 implementation note:

- Added `real_desk_surface_pin_contact_shadow.png` as a Blender-rendered desk-only contact pass.
- The pin-contact pass is normalized, blurred, and composited offline into `real_desk_surface_shadow.png`, then into `real_desk_baked_surface.png`.
- This strengthens small-object grounding for the keyboard, mouse, HomePod, plant, and monitor/raiser area without adding runtime shadow planes.
- `SpatialPortfolio.ts` now also forces the old `setRoomShadowCasting` and helper `box(..., receiveShadow)` paths to keep `castShadow` / `receiveShadow` false.
- `rg` check after v31 has no `ShadowMaterial`, `shadowMap.enabled = true`, `castShadow = true`, `receiveShadow = true`, `mesh.receiveShadow = receiveShadow`, or `portalCastShadow` in `SpatialPortfolio.ts`.

v32 implementation note:

- Added `real_room_floor_pin_contact_shadow.png` as a Blender-rendered floor-only local contact pass.
- This pass targets floor contact for desk legs, chair base/wheels, and floor lamp base. It is normalized with a small blur and composited offline into `real_room_floor_shadow.png`, then into `real_room_floor_baked_surface.png`.
- It improves ground contact from side angles without reintroducing realtime shadows or runtime shadow receiver meshes.
- Front and side browser QA screenshots were captured after entering the room:
  - `.tmp-qa/baked-shadow-v32-floor-pin.png`
  - `.tmp-qa/baked-shadow-v32-side.png`

v3 rebake note:

- Re-exported live model transforms from the running web scene into `.tmp-qa/live_transforms.json`.
- Reran `BAKE_TARGET=all` with `.tmp-qa/bake_real_room_shadows_v2.py`.
- Fixed `make_desk_baked_surface()` so the computed edge feather is actually applied to desktop surface alpha.
- Reran `BAKE_TARGET=surfaces` after that fix.
- Bumped `BAKED_SURFACE_TEXTURE_VERSION` to `3` in `SpatialPortfolio.ts`.
- QA screenshots:
  - `.tmp-qa/rebake-v3b-overhead.png`
  - `.tmp-qa/rebake-v3b-front.png`

Visual status:

- Floor grounding is now baked and visibly softer/more natural than the realtime-shadow experiment.
- The floor bake projection is currently `6.4 x 6.4` world units to avoid the tighter `5.3 x 5.3` floor patch reading like a separate decal.
- v25 forces the floor baked surface alpha to fully feather out at the texture boundary. `real_room_floor_baked_surface.png` edge alpha is now `0`, removing the visible square patch edge.
- v27 removes the separate runtime floor/desk contact overlay planes. The current scene uses only two visible baked surface planes.
- v27 strengthens contact darkening in the offline surface composite so the floor and desktop still ground objects without a runtime grey overlay.
- v28 changes the offline composite from simple linear darkening to broad-shadow plus `smoothstep` contact darkening. Low-alpha broad shadows stay clean; high-alpha contact zones under the keyboard, mouse, monitor stand, plant/HomePod, table, chair, and lamp are more grounded.
- Current alpha checks: `real_room_floor_baked_surface.png` edge max `0`, `real_desk_baked_surface.png` edge max `0`.
- v29 alpha checks after rerunning `BAKE_TARGET=all`: `real_room_floor_baked_surface.png` edge max `0`, `real_desk_baked_surface.png` edge max `0`, `real_room_floor_shadow.png` edge max `0`, and `real_desk_surface_shadow.png` edge max `0`.
- Desk contact shadow is baked into the desktop surface under keyboard, mouse, plant/HomePod area, and monitor stand.
- No hard full-rectangle grey shadow plane is visible in the v28 QA screenshots.
- No runtime grey contact-shadow overlay is present in the v29 screenshot path.
- v31 alpha checks: `real_desk_surface_shadow.png` edge max `0`, `real_desk_baked_surface.png` edge max `0`, `real_room_floor_baked_surface.png` edge max `0`.
- v32 alpha checks: `real_room_floor_pin_contact_shadow.png` edge max `0`, `real_room_floor_shadow.png` edge max `0`, `real_room_floor_baked_surface.png` edge max `0`.
- v3 rebake alpha checks: `real_room_floor_baked_surface.png` edge max `0`, `real_desk_baked_surface.png` edge max `0`.

Model UV feasibility check:

- Most accepted Apple desk assets already have UVs.
- `public/models/OfficeDesk/office_desk.glb` has 25 meshes without UVs, so a full Henry-style lightmap bake will need a Blender Smart UV/lightmap unwrap pass for the desk before exporting a fully baked static room asset.

Full-model bake prototype:

- Script: `.tmp-qa/bake_office_desk_lightmap.py`
- Outputs:
  - `public/textures/baked/office_desk_lightmap.png`
  - `public/models/BakedRoom/office_desk_baked.glb`
  - `.tmp-qa/blender-bake/office_desk_lightmap_bake.blend`
  - `.tmp-qa/baked-office-desk-preview.png`
- Status: prototype only, not integrated into the website.
- What worked: Blender can import the current desk, merge meshes, keep the original `UVMap` for source textures, create a separate `Lightmap` UV, bake to a 2048 texture, promote the lightmap UV to the primary exported UV, and export a GLB with an unlit/emission baked material.
- Important fix discovered: if the exported GLB keeps the original UV as `TEXCOORD_0`, the baked texture samples the wrong UVs and appears black. The script now copies `Lightmap` UVs into the primary `UVMap` before export, which matches Henry's baked-texture assumption.
- What is not good enough yet: the accepted office desk asset is not a clean single baked hero asset. Its large tabletop is visually handled in the website by `real_desk_baked_surface.png`, while the original desk mesh/material alone does not represent the final white desktop well. Replacing the production desk with `office_desk_baked.glb` would currently reduce visual quality.
- Next improvement: keep the current production desk model, but continue baking the desktop receiver and object contact/AO in Blender. For a true Henry-style replacement, author a cleaner desk asset/lightmap in Blender rather than relying on the downloaded office desk GLB as-is.

Full-room lightmap prototype:

- Scripts:
  - `.tmp-qa/bake_static_room_lightmap.py`
  - `.tmp-qa/bake_static_room_group_lightmaps.py`
- Outputs:
  - `public/models/BakedRoom/jianwei_static_room_baked.glb`
  - `public/textures/baked/jianwei_static_room_lightmap.png`
  - `public/models/BakedRoom/jianwei_baked_environment.glb`
  - `public/textures/baked/jianwei_baked_environment_lightmap.png`
  - `public/models/BakedRoom/jianwei_baked_computer_setup.glb`
  - `public/textures/baked/jianwei_baked_computer_setup_lightmap.png`
  - `public/models/BakedRoom/jianwei_baked_decor.glb`
  - `public/textures/baked/jianwei_baked_decor_lightmap.png`
- Result: the pipeline can now export Henry-style unlit baked GLB groups. This proves the correct route technically works.
- Rejected production experiment: enabling `jianwei_baked_environment.glb` in the page created a large hard-edged beige desktop/floor plane. It was disabled again, and production was verified with `.tmp-qa/baked-shadow-v30-production-restored.png`.
- Current issue: the `computer_setup` grouped bake still has UV/material artifacts around the keyboard and small objects. Do not enable this group in production until the small-object bake is split further or the keyboard/mouse are excluded from the baked group.

Remaining gap:

- Henry's quality comes from full model UV/light baking, not only floor/desktop overlays.
- Current Apple desk objects still use runtime PBR materials and environment lighting, so their internal AO/material integration is not yet Henry-level.

## Next Best Step

For another major quality jump, build a Blender-authored static room asset:

1. Import the accepted desk, chair, display, raiser, Mac Studio, lamp, plant, keyboard, mouse, HomePod.
2. Place them in Blender using the current coordinates from `SpatialPortfolio.ts`.
3. Create UV/lightmap unwraps for static objects.
4. Bake diffuse lighting + ambient occlusion + contact shadows into one or a few JPG/PNG textures.
5. Export optimized GLB groups plus baked textures.
6. Load them in Three using a Henry-style `BakedModel` helper with `MeshBasicMaterial`.

Do not go back to realtime shadow tuning unless explicitly requested.
